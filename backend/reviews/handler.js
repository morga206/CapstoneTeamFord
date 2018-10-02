'use strict';

const crypto = require('crypto');

var aws = require('aws-sdk');

const appStoreScraper = require('app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

const APP_STORE_IDS = ['com.ford.fordpass']; // TODO get this from config DB
const GPLAY_IDS = ['com.ford.fordpass']; // TODO get this from config DB

module.exports = {
  handler,
  getReviews,
  scrape,
  convertReviewToDynamoRepresentation
};

async function handler () {
  let reviews = await getReviews();
  var lambda = new aws.Lambda({ region: 'us-east-2' });

  // Invoke NLP Lambda
  await lambda.invoke({
    FunctionName: `sentiment-dashboard-${process.env.STAGE}-nlp`,
    Payload: JSON.stringify(reviews)
  }, function(error, data) {
    if (error) {
      console.log('Error contacting NLP Lambda: ' + error);
    }

    if (data.Payload) {
      console.log('Response from NLP Lambda: ' + data.Payload);
    }
  }).promise();

  return {
    statusCode: 200
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
      allReviews = allReviews.concat(appStoreReviews);
    } catch (error) {
      console.log(`Error processing App Store reviews: ${error}`);
      return [];
    }
  }

  for (let i = 0; i < GPLAY_IDS.length; i++) {
    try {
      let gPlayReviews = await scrape(GPLAY_IDS[i], gPlayScraper, 'Google Play', false);
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
    promises.push(scraper.reviews({
      appId: appId,
      page: i
    }));
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
 * Returns a fucntion that can be used to convert a given review to a DynamoDB representation
 * @param id The appId to use for the DynamoDB object
 * @param store The store to use for the DynamoDB object
 * @param alternateVersion The app version to use if the review data doesn't contain one
 */
function convertReviewToDynamoRepresentation(id, store, alternateVersion) {
  return (review) => {
    let appIdStore = id + '*' + store;

    let reviewHash = crypto.createHash('sha256');
    reviewHash.update(review.text);

    let date = review.date === undefined ? new Date().toISOString() : new Date(review.date).toISOString();
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
