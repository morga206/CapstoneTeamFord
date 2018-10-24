'use strict';

const crypto = require('crypto');

const aws = require('aws-sdk');
const region = process.env.DEPLOY_REGION;
const table = process.env.TABLE_NAME;

const appStoreScraper = require('./xml-app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

const APP_STORE_IDS = ['com.ford.fordpass']; // TODO get this from config DB
const GPLAY_IDS = ['com.ford.fordpass']; // TODO get this from config DB

module.exports = {
  handler,
  getReviews,
  scrape,
  convertReviewToDynamoRepresentation,
  findFirstStoredReview
};

async function handler () {
  let reviews = await getReviews();

  let processedReviews = [];
  try {
    processedReviews = await analyzeReviews(reviews);
  } catch (error){
      console.log('Error during sentiment analysis: ' + error);
      return {
          statusCode: 500, // Internal Server Error
          error: `Error during sentiment analysis: ${error}`
      };
  }


  try {
    await writeReviewsToDB(processedReviews);
  } catch (error){
      console.log('Error writing to Database: ' + error);
      return {
          statusCode: 500, // Internal Server Error
          error: `Error writing to DynamoDB: ${error}`
      };
  };
  return {
        statusCode: 200, // OK
        body: JSON.stringify({
            reviews: processedReviews
        })
  };
}

/**
 * Scrapes all available reviews for the configured apps from Google Play and the App Store 
 */
async function getReviews() {
  let allReviews = [];

  for (let i = 0; i < APP_STORE_IDS.length; i++) {
    try {
      let appStoreReviews = await scrape(APP_STORE_IDS[i], appStoreScraper, 'App Store', true);
      appStoreReviews = await removeDuplicates(APP_STORE_IDS[i], 'App Store', appStoreReviews);
      allReviews = allReviews.concat(appStoreReviews);
    } catch (error) {
      console.log(`Error processing App Store reviews: ${error}`);
      return [];
    }
  }

  for (let i = 0; i < GPLAY_IDS.length; i++) {
    try {
      let gPlayReviews = await scrape(GPLAY_IDS[i], gPlayScraper, 'Google Play', false);
      gPlayReviews = await removeDuplicates(GPLAY_IDS[i], 'Google Play', gPlayReviews);
      allReviews = allReviews.concat(gPlayReviews);
    } catch (error) {
      console.log(`Error processing Google Play reviews: ${error}`);
      return [];
    }
  }

  return allReviews;
}

/**
 * Pull all pages of an app's reviews from the given store
 * @param appId The app ID string to use (NOT a numerical App Store id)
 * @param scraper The scraping module to use 
 * @param store The app store name
 */
async function scrape(appId, scraper, store) {
  let promises = [];

  for (let i = START_PAGE; i <= MAX_PAGE; i++) {
    // if scraping Google Play, throttle request time
    if(store === 'Google Play') {
      promises.push(scraper.reviews({
        appId: appId,
        page: i,
        throttle: 1
      }));
    }
    // no need to throttle Apple App Store
    else{
      promises.push(scraper.reviews({
        appId: appId,
        page: i
      }));
    }
  }

  let allPagesPromise = Promise.all(promises);
  let allPages = [];

  try {
    allPages = await allPagesPromise;
  } catch (error) {
    console.log(`Error getting reviews from ${store}: ${error}`);
    return [];
  }

  let appInfo = await scraper.app({
    appId: appId
  });
  let reviews = [].concat(...allPages).map(await convertReviewToDynamoRepresentation(appId, store, appInfo.version));

  return reviews;
}

/**
 * Returns a function that can be used to convert a given review to a DynamoDB representation
 * @param id The appId to use for the DynamoDB object
 * @param store The store to use for the DynamoDB object
 * @param alternateVersion The app version to use if the review data doesn't contain one
 */
function convertReviewToDynamoRepresentation(id, store, alternateVersion) {
  return (review) => {
    let appIdStore = id + '*' + store;

    let reviewHash = crypto.createHash('sha256');
    reviewHash.update(review.text);

    let date = new Date(review.date).toISOString();
    let version = review.version === undefined ? alternateVersion : review.version;

    return {
      appIdStore: appIdStore,
      reviewHash:  reviewHash.digest('hex'),
      date: date,
      version: version,
      review: review
    };
  };
}

async function removeDuplicates(id, store, reviews) {
  // Pull list of review hashes from DynamoDB, organized by date
  const dynamoDb = new aws.DynamoDB.DocumentClient({
    region: region
  });

  const params = {
    TableName: table,
    IndexName: 'date',
    KeyConditionExpression: 'appIdStore = :appidstore',
    ExpressionAttributeValues: {
      ':appidstore': id + '*' + store
    }
  };

  let dbReviews = [];
  try {
    let dynamoResponse = await dynamoDb.query(params).promise();
    dbReviews = dynamoResponse.Items;
  } catch (error) {
    console.log('Error contacting DynamoDB: ' + error);
    return [];
  }

  // Step through reviews list until we find one already in the DB
  let existingIndex = findFirstStoredReview(reviews, dbReviews);

  // Throw out all reviews older than that review
  return existingIndex >= 0 ? reviews.slice(0, existingIndex) : reviews;
}

/**
 * Find the first review in our list that is already stored in the database
 * @param reviews The list of reviews to check for stored duplicates
 * @param dbReviews The reviews we've already stored
 * @return The index of the first review in reviews that's present in dbReviews
 */
function findFirstStoredReview(reviews, dbReviews) {
  let reviewHashes = dbReviews.map((item) => item.reviewHash);

  for (let i = 0; i < reviews.length; i++) {
    if (reviewHashes.includes(reviews[i].reviewHash)) {
      return i;
    }
  }

  return -1;
}

/**
 * Analyze the reviews and supplement with sentiment data
 * @param reviews The list of reviews we want to analyze for sentiment
 * @return Array list of reviews with sentiment data
 */
async function analyzeReviews(reviews){
  let comprehend = new aws.Comprehend();
  let processedReviews = [];

  // truncate reviews longer than 5000 bytes, to the nearest word
  // https://stackoverflow.com/questions/1515884/using-javascript-to-truncate-text-to-a-certain-size-8-kb
  // always cite your sources!
  for(let i = 0; i < reviews.length; i+=1){
    let text = reviews[i].review.text;

    // convert to a bytestring and get its length
    let textBytes = decodeURIComponent(encodeURIComponent(text));
    //let textBytes = encodeURIComponent(text);
    let textByteLength = textBytes.length;

    // only truncates reviews that are too long
    if(textByteLength > 5000){
      let truncLength = 5000;
      let textBytesTrunc = textBytes.substring(0, truncLength);

      // this section tests the truncated string to make sure there isn't a partial character
      let trimming = true;
      let textTrunc = '';
      while(trimming) {
        try {
          textTrunc = encodeURIComponent(decodeURIComponent(textBytesTrunc));
          //textTrunc = decodeURIComponent(textBytesTrunc);
          trimming = false;
          /*if(textBytesTrunc.length < 5000){
            trimming = false;
          }
          else{
            textBytesTrunc = textBytesTrunc.substring(0, textBytesTrunc.length - 1);
          }*/
        }
        catch (err) {
          textBytesTrunc = textBytesTrunc.substring(0, textBytesTrunc.length - 1);
          console.log(err);
        }
      }

      console.log('made it past truncate while loop');

      // remove last word - no sense in giving NLP a fragment
      let truncArray = textTrunc.split(' ');
      truncArray.pop();
      textTrunc = truncArray.join(' ');

      // update text field of reviews array entry
      reviews[i].review.text = textTrunc;
    }
  }

  // AWS Comprehend only allows 25 strings per request
  for(let i = 0; i < reviews.length; i += 25){
    let start = i;
    let end = i + 25 <= reviews.length ? i + 25 : reviews.length;

    // segment is a shallow copy, changes propagate to reviews array
    let segment = reviews.slice(start, end);
    let params = {
      LanguageCode: 'en',
      TextList: segment.map((review) => review.review.text)
    };

    // Get the noun key phrases
    let comprehendPhrases = await comprehend.batchDetectKeyPhrases(params).promise();
    let comprehendPhrasesResults = comprehendPhrases.ResultList;
    comprehendPhrasesResults.forEach((keyPhrases) => {
      let keyWords = []
      let review = segment[keyPhrases.Index];

      for(let k = 0; k < keyPhrases.KeyPhrases.length; k++){
        keyWords.push(keyPhrases.KeyPhrases[k].Text)
      }

      review.keywords = keyWords
    });

    // Get the actual sentiment and sentimentScore
    let comprehendResponse = await comprehend.batchDetectSentiment(params).promise();
    let comprehendResults = comprehendResponse.ResultList;
    comprehendResults.forEach((sentiment) => {
      let review = segment[sentiment.Index];

      review.sentiment = sentiment.Sentiment; // POSITIVE, NEGATIVE, NEUTRAL, or MIXED
      review.sentimentScore = sentiment.SentimentScore; // Confidence of sentiment rating

      processedReviews.push(review);
    });
  }

  return processedReviews;
}

/**
 * Write the reviews with sentiment to the DynamoDB
 * @param reviews The reviews we want to write to
 */
async function writeReviewsToDB(reviews){

    let dynamo = new aws.DynamoDB.DocumentClient();

    for (let i = 0; i < reviews.length; i++){

      // DynamoDB doesn't allow for emptry strings so we'll remove any keys with emptry string values
      let removeFields = [];

      let raw_review = reviews[i].review;
      let raw_review_keys = Object.keys(raw_review);  // Get the keys

      // Determine fields that are empty strings
      for (let index in raw_review_keys){
        if (raw_review[raw_review_keys[index]] == "") {
          removeFields.push(raw_review_keys[index]);
        }
      }

      // After determining fields to delete, delete them
      for (let removeField in removeFields) {
        delete raw_review[removeFields[removeField]];
      }

      // Params for writing the review to database
      let params = {
        TableName: table,
        Item: reviews[i]
      }

      try {
        await dynamo.put(params).promise();
      } catch (err) {
        console.log(reviews[i]);
      }


    }
}
