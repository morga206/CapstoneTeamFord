'use strict';

const appStoreScraper = require('app-store-scraper');
const gPlayScraper = require('google-play-scraper');

const START_PAGE = 0;
const MAX_PAGE = 9;

const APP_STORE_IDS = [1095418609]; // TODO get this from config DB
const GPLAY_IDS = ['com.ford.fordpass']; // TODO get this from config DB

module.exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: scrapeApps()
    }),
  };
};

function scrapeApps() {
  let reviews = [];

  for (let appId in APP_STORE_IDS) {
    reviews.concat(scrape(appId, appStoreScraper));
  }

  for (let appId in GPLAY_IDS) {
    reviews.concat(scrape(appId, gPlayScraper));
  }

  return reviews;
}

function scrape(appId, scraper) {
  let reviews = [];

  for (let i = START_PAGE; i <= MAX_PAGE; i++) {
    scraper.reviews({
      appId: appId,
      page: i
    }).then (pageReviews => {
      reviews.concat(pageReviews);
    });
  }

  return reviews;
}
