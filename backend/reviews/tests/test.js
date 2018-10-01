'use strict';
var assert = require('assert');
var handler = require('../handler');
var crypto = require('crypto');

describe('handler', function() {
  describe('#getReviews()', function() {
    it('should return reviews from both App Store and Google Play', async () => {
      const reviews = await handler.getReviews();
      const appStoreReview = reviews.find(function (review) {
        return review.appIdStore.endsWith('App Store');
      });
      assert.notEqual(appStoreReview, undefined);
      const gPlayReview = reviews.find(function (review) {
        return review.appIdStore.endsWith('*Google Play');
      });
      assert.notEqual(gPlayReview, undefined);
    }).timeout(0);
    it('should include the app id and store for app reviews', async () => {
      const reviews = await handler.getReviews();
      assert.notEqual(reviews[0].appIdStore, undefined);
    }).timeout(0);
  });
  describe('#scrape(appId, scraper, store)', function() {
    const mockScraper = {
      reviews: function (params) {
        return new Promise((resolve) => {
          resolve([{
            page: params.page,
            title: 'Example Review',
            text: 'This is some sample review text.'
          }]);
        });
      }
    };
    it('should scrape all pages of an app\'s reviews', async () => {
      let reviews = await handler.scrape('test app id', mockScraper, 'test store');
      for (let i = 0; i <= 9; i++) {
        assert.equal(reviews[i].review.page, i);
      }
    });
    it('should add an appStoreId field to each review', async () => {
      let reviews = await handler.scrape('test app id', mockScraper, 'test store');
      for (let i = 0; i <= 9; i++) {
        assert.equal(reviews[i].appIdStore, 'test app id*test store');
      }
    });
  });

  describe('#convertReviewToDynamoRepresentation(id, store)', function() {
    it('should generate a DynamoDB review with the correct metadata included', function() {
      let mockReview = {
        text: 'This is some review text.',
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0'
      };

      let reviewProcessingFunction = handler.convertReviewToDynamoRepresentation('test id', 'test store');

      let dynamoReview = reviewProcessingFunction(mockReview);
      
      let testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview.text);
      let expected = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview, 
      };

      assert.deepEqual(expected, dynamoReview);
    });
  });
});