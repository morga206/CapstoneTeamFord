var assert = require('assert');
var handler = require('../handler');

describe('handler', function() {
  describe('#getReviews()', function() {
    it('should return reviews from both App Store and Google Play', async () => {
      const reviews = await handler.getReviews();
      const appStoreReview = reviews.find(function (review) {
        return review.store == 'App Store';
      });
      assert.notEqual(appStoreReview, undefined);
      const gPlayReview = reviews.find(function (review) {
        return review.store == 'Google Play';
      });
      assert.notEqual(gPlayReview, undefined);
    }).timeout(0);
    it('should include the app id and store for app reviews', async () => {
      const reviews = await handler.getReviews();
      assert.notEqual(reviews[0].id, undefined);
      assert.notEqual(reviews[0].store, undefined);
    }).timeout(0);
  });
  describe('#scrape(appId, scraper, store)', function() {
    const mockScraper = {
      reviews: function (params) {
        return new Promise((resolve) => {
          resolve([{
            page: params.page,
            title: 'Example Review'
          }]);
        });
      }
    };
    it('should scrape all pages of an app\'s reviews', async () => {
      let reviews = await handler.scrape('test app id', mockScraper, 'test store');
      for (let i = 0; i <= 9; i++) {
        assert.equal(reviews[i].page, i);
      }
    });
    it('should add an id and store field to each review', async () => {
      let reviews = await handler.scrape('test app id', mockScraper, 'test store');
      for (let i = 0; i <= 9; i++) {
        assert.equal(reviews[i].id, 'test app id');
        assert.equal(reviews[i].store, 'test store');
      }
    });
  });
});