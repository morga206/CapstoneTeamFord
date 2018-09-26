'use strict';

const appStoreScraper = require('app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

const APP_STORE_IDS = [1095418609]; // TODO get this from config DB
const GPLAY_IDS = ['com.ford.fordpass']; // TODO get this from config DB

module.exports.handler = async () => {
  console.log(await getReviews());
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: await getReviews()
    }),
  };
};

async function getReviews() {
  let reviews = [];

  for (let i = 0; i < GPLAY_IDS.length; i++) {
    let pages = await scrapeGPlay(GPLAY_IDS[i]);
    pages = [].concat(...pages);
    pages.forEach((review) => {
      review.id = GPLAY_IDS[i];
      review.store = "Google Play";
    })
    reviews = reviews.concat(pages);
  }

  for (let i = 0; i < APP_STORE_IDS.length; i++) {
    let pages = await scrapeAppStore(APP_STORE_IDS[i]);
    pages = [].concat(...pages);
    pages.forEach((review) => {
      review.id = APP_STORE_IDS[i];
      review.store = "App Store";
    })
    reviews = reviews.concat(pages);
  }

  return reviews;
}

function scrapeAppStore(appId) {
  let promises = [];

  for (let i = START_PAGE; i <= MAX_PAGE; i++) {
    promises.push(appStoreScraper.reviews({
      id: appId,
      page: i
    }));
  }

  return Promise.all(promises);
}

function scrapeGPlay(appId) {
  let promises = [];

  for (let i = START_PAGE; i <= MAX_PAGE; i++) {
    promises.push(gPlayScraper.reviews({
      appId: appId,
      page: i
    }));
  }

  return Promise.all(promises);
}
