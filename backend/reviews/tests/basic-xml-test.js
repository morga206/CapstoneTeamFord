const appleScraper = require('../xml-app-store-scraper');
// const appleScraper = require('app-store-scraper');
// const appleScraper = require('google-play-scraper');
const appId = 'com.ford.fordpass';
const page_num = 1;
let reviews = [];

fetchAppleReviews(appId, reviews, page_num);

function fetchAppleReviews(appId, reviews, page_num){

  appleScraper.reviews({
    appId: appId,
    page: page_num
  })
    .then(ans => {
      let ans_length = ans.length;

      let oldest_review = ans[ans_length - 1];
      // oldest_review.date = new Date(oldest_review.date).toISOString();
      let edited_date = new Date(oldest_review.date).toISOString();
      console.log('this is the converted date');
      console.log(typeof edited_date);
      console.log(edited_date);

      let generic_date = new Date().toISOString();
      console.log('this is a generic date');
      console.log(typeof generic_date);
      console.log(generic_date);

      // console.log(oldest_review.date);
      // console.log(oldest_review);


      /* for(var review in ans){
        console.log('printing review type');
        console.log(typeof review);
        console.log('printing review contents');
        console.log(ans[review]);
      } */
    })
    .catch(console.log);
}