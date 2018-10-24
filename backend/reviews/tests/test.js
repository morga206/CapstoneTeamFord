'use strict';
var assert = require('assert');
var handler = require('../handler');
var crypto = require('crypto');

describe('handler', function() {
  describe('#scrape(appId, scraper, store)', function() {
    const mockScraper = {
      reviews: function (params) {
        return new Promise((resolve) => {
          resolve([{
            page: params.page,
            title: 'Example Review',
            text: 'This is some sample review text.',
            date: new Date('12-01-2001').toISOString()
          }]);
        });
      },
      app: function (params) {
        return new Promise((resolve) => {
          resolve({
            appId: params.appId,
            version: '1.0.0'
          });
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
        id: '12345',
        text: 'This is some review text.',
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0'
      };

      let reviewProcessingFunction = handler.convertReviewToDynamoRepresentation('test id', 'test store', '');

      let dynamoReview = reviewProcessingFunction(mockReview);
      
      let testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview.text + mockReview.id);
      let expected = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview, 
      };

      assert.deepEqual(expected, dynamoReview);
    });
    it('should generate a DynamoDB review even if version is missing', function() {
      let mockReview = {
        id: 'abcd567',
        text: 'This is some review text.',
        date: new Date().toISOString()
      };

      let reviewProcessingFunction = handler.convertReviewToDynamoRepresentation('test id', 'test store', '');

      let dynamoReview = reviewProcessingFunction(mockReview);
      
      let testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview.text + mockReview.id);
      let expected = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date().toISOString(),
        version: '',
        review: mockReview, 
      };

      assert.deepEqual(expected, dynamoReview);
    });
  });
  describe('#findFirstStoredReview(reviews, dbReviews)', function() {
    it('should return -1 for an empty db', function() {
      let dbReviews = [];
      let reviews = [{ reviewHash: 'abcdef'}];

      assert.equal(handler.findFirstStoredReview(reviews, dbReviews), -1);
    });
    it('should return -1 for all new reviews', function() {
      let dbReviews = [{reviewHash: '123456'}, {reviewHash: 'tuvwxy'}, {reviewHash: '123jkl'}];
      let reviews = [{ reviewHash: 'abcdef'}];

      assert.equal(handler.findFirstStoredReview(reviews, dbReviews), -1);
    });
    it('should correctly return index of first duplicate when list and db overlap', function() {
      let dbReviews = [{reviewHash: '123456'}, {reviewHash: 'tuvwxy'}, {reviewHash: '123jkl'}];
      let reviews = [{reviewHash: 'abcdef'}, { reviewHash: 'tuvwxy'}, {reviewHash: '123jkl'}];

      assert.equal(handler.findFirstStoredReview(reviews, dbReviews), 1);
    });
  });
});
