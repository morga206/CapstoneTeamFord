'use strict';

const crypto = require('crypto');
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
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: await getReviews()
    }),
  };
}

/**
 * Scrapes all available reviews for the configured apps from Google Play and the App Store 
 */
async function getReviews() {
  let allReviews = [];

  for (let i = 0; i < APP_STORE_IDS.length; i++) {
    try {
      let appReviews = await scrape(APP_STORE_IDS[i], appStoreScraper, 'App Store', true);
      allReviews = allReviews.concat(appReviews);
    } catch (error) {
      console.log(`Error processing App Store reviews: ${error}`);
      return [];
    }
  }

  for (let i = 0; i < GPLAY_IDS.length; i++) {
    try {
      let appReviews = await scrape(GPLAY_IDS[i], gPlayScraper, 'Google Play', false);
      allReviews = allReviews.concat(appReviews);
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

  let reviews = [].concat(...allPages).map(convertReviewToDynamoRepresentation(appId, store));

  return reviews;
}

/**
 * Returns a fucntion that can be used to convert a given review to a DynamoDB representation
 * @param id The appId tp use for the DynamoDB object
 * @param store The store to use for the DynamoDB oject
 */
function convertReviewToDynamoRepresentation(id, store) {
  return (review) => {
    let appIdStore = id + '*' + store;

    let reviewHash = crypto.createHash('sha256');
    reviewHash.update(review.text);

    let date = review.date === undefined ? new Date().toISOString() : new Date(review.date).toISOString();
    let version = review.version === undefined ? '-1' : review.version;
    return {
      appIdStore: appIdStore,
      reviewHash:  reviewHash.digest('hex'),
      date: date,
      version: version,
      review: review
    };
  }
}
