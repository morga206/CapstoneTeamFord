const appleScraper = require('../old-xml-app-store-scraper');
// const appleScraper = require('app-store-scraper');
// const appleScraper = require('google-play-scraper');
const appId = 'com.ford.fordpass';
const page_num = 1;
var reviews = [];

fetchAppleReviews(appId, reviews, page_num);

function fetchAppleReviews(appId, reviews, page_num){

  appleScraper.reviews({
    appId: appId,
    page: page_num
  })
    .then(ans => {
      console.log(ans);
      // For each review on the current page we're scraping
      /* for(var review in ans){
        console.log('printing review');
        console.log(review);
      } */
    })
    .catch(console.log);
}