'use strict';
const crypto = require('crypto');

const aws = require('aws-sdk');
const region = process.env.DEPLOY_REGION;
const stage = process.env.STAGE;
const table = process.env.TABLE_NAME;

const appStoreScraper = require('./xml-app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

module.exports = {
  handler,
  getReviews,
  scrape,
  convertReviewToDynamoRepresentation,
  removeEmptyFields,
  findFirstStoredReview,
  truncateReviews,
  createDynamoBatchRequest
};

async function handler () {
  let appList = '';
  try {
    appList = await getAppList();
  } catch (error) {
    return {
      statusCode: 500, // Internal Server Error
      error: `Error getting app list: ${error}`
    };
  }

  let reviews = [];
  try {
    reviews = await getReviews(appList);
  } catch (error) {
    return {
      statusCode: 500, // Internal Server Error
      error: `Error getting reviews: ${error}`
    };
  } 

  let processedReviews = [];
  try {
    processedReviews = await analyzeReviews(reviews);
  } catch (error) {
    console.log(`Error during sentiment analysis: ${error}`);
    return {
      statusCode: 500, // Internal Server Error
      error: `Error during sentiment analysis: ${error}`
    };
  }


  try {
    await writeReviewsToDB(processedReviews);
  } catch (error) {
    return {
      statusCode: 500, // Internal Server Error
      error: `Error writing to DynamoDB: ${error}`
    };
  }

  return {
    statusCode: 200, // OK
    body: JSON.stringify({
      length: processedReviews.length,
      reviews: processedReviews
    })
  };
}

/**
 * Sets the app list from SSM
 */
async function getAppList() {
  const ssm = new aws.SSM();
  const params = {
    Name: `appList-${stage}`
  };

  let appListResponse;

  try {
    appListResponse = await ssm.getParameter(params).promise();
  } catch (error) {
    console.log(`Error getting app list: ${error}`);
    throw error;
  }

  return appListResponse.Parameter.Value;
  
}

/**
 * Scrapes all available reviews for the configured apps from Google Play and the App Store 
 * @param appList The list of apps to scrape
 */
async function getReviews(appList) {
  let allReviews = [];

  let appListObject;
  try {
    appListObject = JSON.parse(appList);
  } catch (error) {
    console.log(`Error parsing appList: ${error}`);
    throw error;
  }
  
  const appStoreIds = appListObject
    .filter((app) => app.store === 'App Store')
    .map((app) => app.appId);

  const gPlayIds = appListObject
    .filter((app) => app.store === 'Google Play')
    .map((app) => app.appId);

  for (let i = 0; i < appStoreIds.length; i++) {
    try {
      let appStoreReviews = await scrape(appStoreIds[i], appStoreScraper, 'App Store', true);
      appStoreReviews = await removeDuplicates(appStoreIds[i], 'App Store', appStoreReviews);
      allReviews = allReviews.concat(appStoreReviews);
    } catch (error) {
      console.log(`Error processing App Store reviews: ${error}`);
      throw error;
    }
  }

  for (let i = 0; i < gPlayIds.length; i++) {
    try {
      let gPlayReviews = await scrape(gPlayIds[i], gPlayScraper, 'Google Play', false);
      gPlayReviews = await removeDuplicates(gPlayIds[i], 'Google Play', gPlayReviews);
      allReviews = allReviews.concat(gPlayReviews);
    } catch (error) {
      console.log(`Error processing Google Play reviews: ${error}`);
      throw error;
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
    } else if (store === 'App Store') {
      promises.push(scraper.reviews({
        appId: appId,
        page: i + 1
      }));
    }
  }

  let allPagesPromise = Promise.all(promises);
  let allPages = [];

  try {
    allPages = await allPagesPromise;
  } catch (error) {
    console.log(`Error getting reviews from ${store}: ${error}`);
    throw error;
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
    try {
      reviewHash.update(review.text + review.id);
    } catch(error) {
      console.log(`Error creating review hash: ${error}`);
      throw error;
    }

    let date = new Date(review.date).toISOString();
    let version = review.version === undefined ? alternateVersion : review.version;

    // DynamoDB doesn't like empty strings
    removeEmptyFields(review);

    return {
      appIdStore: appIdStore,
      reviewHash:  reviewHash.digest('hex'),
      date: date,
      version: version,
      review: review
    };
  };
}

/**
 * Remove the empty fields from a review
 * @param  review The review to process
 */
function removeEmptyFields(review) {
  let toRemove = [];

  Object.keys(review).forEach((key) => {
    if (review[key] === '') {
      toRemove.push(key);
    }
  });

  toRemove.forEach((key) => delete review[key]);
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
    console.log(`Error contacting DynamoDB: ${error}`);
    throw error;
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
async function analyzeReviews(reviews) {
  let comprehend = new aws.Comprehend();
  let processedReviews = [];

  // AWS Comprehend only allows 5000 bytes per string
  // (Some app stores are slightly longer than this, ~6000 bytes, so we truncate)
  truncateReviews(reviews);

  // AWS Comprehend only allows 25 strings per request
  for(let i = 0; i < reviews.length; i += 25){
    let start = i;
    let end = i + 25 <= reviews.length ? i + 25 : reviews.length;

    let segment = reviews.slice(start, end);
    let params = {
      LanguageCode: 'en',
      TextList: segment.map((review) => review.review.text)
    };

    // Get the noun key phrases
    let comprehendPhrases = await comprehend.batchDetectKeyPhrases(params).promise();
    let comprehendPhrasesResults = comprehendPhrases.ResultList;
    comprehendPhrasesResults.forEach((result) => {
      let review = segment[result.Index];
      review.keywords = result.KeyPhrases.map((phrase) => phrase.Text);
    });

    // Get the sentiment and sentimentScore
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
 * Truncate reviews by the word to be less than 5000 bytes
 * @param reviews The list of reviews to process
 */
function truncateReviews(reviews) {
  const MAX_LENGTH_BYTES = 5000;
  const textEncoder = new (require('util').TextEncoder)('utf-8');

  for(let i = 0; i < reviews.length; i+=1){
    let text = reviews[i].review.text;

    // Get string length in bytes
    // https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    let lengthInBytes = textEncoder.encode(text).length;

    while (lengthInBytes > MAX_LENGTH_BYTES) {
      // Remove last word
      let lastSpace = text.lastIndexOf(' ');
      text = text.substring(0, lastSpace);

      lengthInBytes = textEncoder.encode(text).length;
    }

    reviews[i].review.text = text;
  }
}

/**
 * Write the reviews to the DynamoDB table
 * @param reviews The reviews to write
 */
async function writeReviewsToDB(reviews){

  let dynamoDb = new aws.DynamoDB.DocumentClient();

  // DynamoDB only allows 25 PutRequests at a time
  for (let i = 0; i < reviews.length; i += 25) {
    let start = i;
    let end = i + 25 <= reviews.length ? i + 25 : reviews.length;

    let dynamoRequest = createDynamoBatchRequest(reviews.slice(start, end));
    try {
      await dynamoDb.batchWrite(dynamoRequest).promise();
    } catch (error) {
      console.log(`Error writing to DynamoDB: ${error}`);
      throw error;
    }
  }
}

/**
 * Create a series of Put requests for the DynamoDB BatchWrite operation
 * @param items The items to Put
 */
function createDynamoBatchRequest(items) {
  let putItems = [];
  for (let i = 0; i < items.length; i++) {
    putItems.push({
      PutRequest: {
        Item: items[i]
      }
    });
  }

  let dynamoRequest = {
    RequestItems: {}
  };
  dynamoRequest.RequestItems[table] = putItems;

  return dynamoRequest;
}
