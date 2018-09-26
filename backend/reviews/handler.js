'use strict';
const appStoreScraper = require('app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

const APP_STORE_IDS = ['com.ford.fordpass']; // TODO get this from config DB
const GPLAY_IDS = ['com.ford.fordpass']; // TODO get this from config DB

module.exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: await getReviews()
    }),
  };
};

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

  let reviews = [].concat(...allPages);
  reviews.forEach((review) => {
    review.id = appId;
    review.store = store;
  });

  return reviews;
}
