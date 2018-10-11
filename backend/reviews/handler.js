'use strict';

const crypto = require('crypto');

const aws = require('aws-sdk');
const region = process.env.DEPLOY_REGION;
const table = process.env.TABLE_NAME;
const stage = process.env.STAGE;

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
  var lambda = new aws.Lambda({ region: region });

  // Invoke NLP Lambda
  try {
    const response = await lambda.invoke({
      FunctionName: `sentiment-dashboard-${stage}-nlp`,
      Payload: JSON.stringify(reviews)
    }).promise();
    return {
      statusCode: 200, // OK
      body: JSON.stringify({
        response: response.Payload,
        reviews: reviews
      })
    };
  }  catch (error) {
    console.log('Error contacting NLP Lambda: ' + error);
    return {
      statusCode: 500, // Internal Server Error
      error: `Error from NLP Lambda: ${error}`
    };
  }
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
