'use strict';
var assert = require('assert');

const TEST_TABLE = 'testTable';
// Set mock env variable before handler load for Dynamo Request tests
process.env.TABLE_NAME = TEST_TABLE;

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
        date: new Date('12-21-2001').toISOString()
      };

      let reviewProcessingFunction = handler.convertReviewToDynamoRepresentation('test id', 'test store', '');

      let dynamoReview = reviewProcessingFunction(mockReview);
      
      let testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview.text + mockReview.id);
      let expected = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date('12-21-2001').toISOString(),
        version: '',
        review: mockReview, 
      };

      assert.deepEqual(expected, dynamoReview);
    });
    it('should generate different hashes even for identical review text', function() {
      let mockReview1 = {
        id: 'abcd567',
        text: 'This is some review text.',
        date: new Date('12-21-2001').toISOString()
      };

      let mockReview2 = {
        id: '123456',
        text: 'This is some review text.',
        date: new Date('12-21-2001').toISOString()
      };

      let reviewProcessingFunction = handler.convertReviewToDynamoRepresentation('test id', 'test store', '');

      let dynamoReview1 = reviewProcessingFunction(mockReview1);
      let dynamoReview2 = reviewProcessingFunction(mockReview2);
      
      let testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview1.text + mockReview1.id);
      let expected1 = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date('12-21-2001').toISOString(),
        version: '',
        review: mockReview1 
      };

      testReviewHash = crypto.createHash('sha256');
      testReviewHash.update(mockReview2.text + mockReview2.id);
      let expected2 = {
        appIdStore: 'test id*test store',
        reviewHash: testReviewHash.digest('hex'),
        date: new Date('12-21-2001').toISOString(),
        version: '',
        review: mockReview2
      };

      assert.deepEqual(expected1, dynamoReview1);
      assert.deepEqual(expected2, dynamoReview2);
      assert.notDeepEqual(dynamoReview1.reviewHash, dynamoReview2.reviewHash);
    });
  });
  describe('#removeEmptyFields(review)', function() {
    it('should handle an empty object', function () {
      let review = {};
      handler.removeEmptyFields(review);
      assert.deepEqual(review, {});
    });
    it('should handle reviews without empty fields', function() {
      let mockReview = {
        id: 'abcd567',
        title: 'Some review title',
        text: 'This is some review text.',
        date: new Date('07-04-2017').toISOString()
      };

      // Need to make a copy of our mockReview so removeEmptyFields doesn't modify the original
      let result = Object.assign({}, mockReview);
      handler.removeEmptyFields(result);

      assert.deepEqual(result, mockReview);
    });
    it('should remove any empty fields from reviews', function(){
      let mockReview = {
        id: 'abcd567',
        title: '',
        text: 'This is some review text.',
        date: new Date('01-01-1998').toISOString()
      }; 
      let expected = {
        id: 'abcd567',
        // No title - empty field removed
        text: 'This is some review text.',
        date: new Date('01-01-1998').toISOString()
      };

      // Need to make a copy of our mockReview so removeEmptyFields doesn't modify the original
      let result = Object.assign({}, mockReview);
      handler.removeEmptyFields(result);

      assert.deepEqual(result, expected);
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
  describe('#truncateReviews(reviews)', function() {
    it('should handle an empty list', function() {
      let reviews = [];
      handler.truncateReviews(reviews);
      assert.deepEqual(reviews, []);
    });
    it('should pass through reviews shorter than the max amount of bytes', function() {
      let mockReview = {
        id: 'abcd567',
        title: '',
        text: 'This is some review text.',
        date: new Date('12-01-2001').toISOString()
      };

      let mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(mockReview.text + mockReview.id);
      let mockDbItem = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview, 
      };

      // Need to make a copy of our mockReview so truncateReviews doesn't modify the original
      let result = [Object.assign({}, mockDbItem)];
      handler.truncateReviews(result);

      assert.deepEqual(result, [mockDbItem]);
    });
    it('should truncate reviews by the word to the maximum byte length', function () {
      let mockReview = {
        id: 'abcd567',
        title: '',
        text: 'This is some review text.',
        date: new Date('12-01-2001').toISOString()
      };

      let reallyLongMockReview = {
        id: '123456',
        title: '',
        text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin fermentum libero eget vestibulum pulvinar. Pellentesque posuere iaculis neque, quis tempus ante sollicitudin blandit. Integer magna mauris, scelerisque ac auctor pulvinar, posuere at velit. Vestibulum efficitur posuere dignissim. Vivamus eu sodales libero. Donec sit amet erat risus. Nullam metus massa, dignissim quis commodo et, sollicitudin in orci. Maecenas maximus augue sit amet rutrum lobortis. Mauris faucibus lectus nec dignissim accumsan. Suspendisse malesuada ac urna eget tincidunt. Aliquam aliquam quis dolor quis finibus.
Vestibulum vestibulum et mi in laoreet. Donec ut convallis lacus, in ultrices lorem. Suspendisse ultricies posuere nunc, at aliquam lacus fermentum at. Nam ut posuere nibh. Fusce posuere justo velit, sed pulvinar elit tempor sed. Maecenas dignissim, nibh tristique blandit pulvinar, enim nisi aliquam mauris, quis gravida massa sapien at dui. Phasellus pulvinar accumsan elit eu convallis. Suspendisse augue nunc, lacinia id nibh quis, pretium aliquam sapien. Nulla consequat faucibus dolor, in fringilla mauris vulputate vulputate. Nulla sit amet libero dolor. Ut a feugiat tortor, sit amet rutrum lectus. Ut eu fermentum lorem, eget elementum neque. Mauris fringilla, eros eu gravida luctus, purus sem malesuada neque, in porttitor diam diam ac mi. Pellentesque ornare euismod dignissim. Sed eu arcu erat. Phasellus et lacinia lectus.
Fusce ante enim, laoreet eu dapibus nec, dignissim id elit. Praesent at elit quam. Duis lobortis ipsum velit, et euismod nisi accumsan aliquet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Cras id erat non turpis sagittis finibus sed vitae enim. Phasellus malesuada posuere enim. Donec in aliquet velit, vitae imperdiet erat. Maecenas at mauris massa. Donec aliquam, enim nec venenatis tempus, nibh augue efficitur velit, a consectetur dui velit a arcu.
In hac habitasse platea dictumst. Nullam interdum lorem eget enim ultricies, ac efficitur mauris dapibus. Vivamus mollis diam commodo justo vulputate interdum. Suspendisse vel eros vel dui pretium mattis et et arcu. Praesent mi nulla, efficitur id mi sed, varius varius turpis. Cras sem lorem, dignissim at semper at, dignissim sit amet massa. Vestibulum at turpis pellentesque, bibendum leo vel, finibus justo. Etiam ac orci euismod, pharetra massa ut, maximus magna. Donec a euismod urna. Suspendisse nulla ligula, consequat eu nulla ac, semper consequat ex. Donec sit amet aliquet justo. Nam gravida dolor vitae enim eleifend, at varius lorem eleifend. Donec in lectus bibendum quam sollicitudin fringilla a quis enim. Suspendisse velit nunc, fringilla et pretium ac, suscipit egestas sapien. Sed tellus nisl, pulvinar vitae erat at, vestibulum volutpat erat.        
Pellentesque vitae tellus ultricies, blandit velit in, commodo urna. Donec hendrerit molestie erat in vehicula. Aliquam ut elit id enim elementum dictum. Integer in risus nibh. Sed accumsan magna vitae lectus accumsan sodales. Nulla a dapibus lorem. Phasellus tristique hendrerit vulputate. In hac habitasse platea dictumst. Nullam luctus nisi sit amet varius fermentum. Suspendisse eu facilisis dolor. Praesent mi ante, volutpat eu ex nec, accumsan faucibus justo.
Praesent ac orci a elit placerat tincidunt. Suspendisse potenti. Etiam volutpat leo lectus, vel feugiat nibh vestibulum et. Nulla dictum vel turpis id molestie. Nam sed ex nec turpis tempus consectetur. Morbi convallis, quam a laoreet molestie, purus enim euismod dui, id porttitor odio ipsum vitae quam. Cras accumsan ultricies nunc eu pretium. Donec fringilla facilisis sem feugiat suscipit.
Phasellus ut finibus massa. Integer vitae purus iaculis, fringilla mauris non, vehicula diam. Mauris eget metus sapien. Nulla sed nulla at purus mattis fermentum id ac erat. Ut vel ultricies nisl. Phasellus fermentum, felis nec laoreet lacinia, felis nunc pulvinar enim, eget bibendum erat augue eu turpis. Vestibulum ac urna commodo, sagittis metus nec, lacinia massa. Integer auctor pharetra leo vel eleifend. Nullam interdum libero vel massa fringilla mattis. Donec vel urna eget ligula efficitur finibus eu a purus. Donec vitae enim eros. Vivamus sit amet ipsum eget nisi pulvinar consectetur vel eu est. Fusce ex diam, dapibus a tempor luctus, euismod eu dolor. Morbi faucibus elit vitae ipsum commodo tincidunt.
Ut et blandit quam. Mauris ut rhoncus sapien, quis dignissim elit. Praesent sit amet augue eu tortor maximus consequat sit amet vel neque. Nulla scelerisque dui id pellentesque ultrices. Nulla ornare nisi turpis, et ornare erat bibendum vitae. Etiam blandit tellus in nunc viverra scelerisque. Sed dapibus nulla id imperdiet tincidunt. Curabitur at massa sit amet est rutrum congue. Fusce vitae augue feugiat, iaculis lacus non, dapibus magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec consequat ligula, at molestie augue. Sed accumsan dictum nisl, eu consectetur enim consequat vel.
Phasellus efficitur pretium ornare. Sed eget elit eu dui congue dignissim. Phasellus feugiat metus orci, eget lacinia lacus ultrices vel. Maecenas ut ex justo. Praesent consectetur tempor velit, eu imperdiet ipsum. Nam a enim id turpis pretium fringilla. Nulla viverra pulvinar rhoncus. Duis sagittis justo sed libero tincidunt, nec molestie est elementum. Phasellus in aliquet purus. Nam id lacus in felis aliquam maximus sed ac ex. Nullam viverra id neque nec euismod. Vestibulum ante ipsum primis in faucibus orci metus.`,
        date: new Date('12-01-2001').toISOString()  
      };
      let expectedReview = {
        id: '123456',
        title: '',
        text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin fermentum libero eget vestibulum pulvinar. Pellentesque posuere iaculis neque, quis tempus ante sollicitudin blandit. Integer magna mauris, scelerisque ac auctor pulvinar, posuere at velit. Vestibulum efficitur posuere dignissim. Vivamus eu sodales libero. Donec sit amet erat risus. Nullam metus massa, dignissim quis commodo et, sollicitudin in orci. Maecenas maximus augue sit amet rutrum lobortis. Mauris faucibus lectus nec dignissim accumsan. Suspendisse malesuada ac urna eget tincidunt. Aliquam aliquam quis dolor quis finibus.
Vestibulum vestibulum et mi in laoreet. Donec ut convallis lacus, in ultrices lorem. Suspendisse ultricies posuere nunc, at aliquam lacus fermentum at. Nam ut posuere nibh. Fusce posuere justo velit, sed pulvinar elit tempor sed. Maecenas dignissim, nibh tristique blandit pulvinar, enim nisi aliquam mauris, quis gravida massa sapien at dui. Phasellus pulvinar accumsan elit eu convallis. Suspendisse augue nunc, lacinia id nibh quis, pretium aliquam sapien. Nulla consequat faucibus dolor, in fringilla mauris vulputate vulputate. Nulla sit amet libero dolor. Ut a feugiat tortor, sit amet rutrum lectus. Ut eu fermentum lorem, eget elementum neque. Mauris fringilla, eros eu gravida luctus, purus sem malesuada neque, in porttitor diam diam ac mi. Pellentesque ornare euismod dignissim. Sed eu arcu erat. Phasellus et lacinia lectus.
Fusce ante enim, laoreet eu dapibus nec, dignissim id elit. Praesent at elit quam. Duis lobortis ipsum velit, et euismod nisi accumsan aliquet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Cras id erat non turpis sagittis finibus sed vitae enim. Phasellus malesuada posuere enim. Donec in aliquet velit, vitae imperdiet erat. Maecenas at mauris massa. Donec aliquam, enim nec venenatis tempus, nibh augue efficitur velit, a consectetur dui velit a arcu.
In hac habitasse platea dictumst. Nullam interdum lorem eget enim ultricies, ac efficitur mauris dapibus. Vivamus mollis diam commodo justo vulputate interdum. Suspendisse vel eros vel dui pretium mattis et et arcu. Praesent mi nulla, efficitur id mi sed, varius varius turpis. Cras sem lorem, dignissim at semper at, dignissim sit amet massa. Vestibulum at turpis pellentesque, bibendum leo vel, finibus justo. Etiam ac orci euismod, pharetra massa ut, maximus magna. Donec a euismod urna. Suspendisse nulla ligula, consequat eu nulla ac, semper consequat ex. Donec sit amet aliquet justo. Nam gravida dolor vitae enim eleifend, at varius lorem eleifend. Donec in lectus bibendum quam sollicitudin fringilla a quis enim. Suspendisse velit nunc, fringilla et pretium ac, suscipit egestas sapien. Sed tellus nisl, pulvinar vitae erat at, vestibulum volutpat erat.        
Pellentesque vitae tellus ultricies, blandit velit in, commodo urna. Donec hendrerit molestie erat in vehicula. Aliquam ut elit id enim elementum dictum. Integer in risus nibh. Sed accumsan magna vitae lectus accumsan sodales. Nulla a dapibus lorem. Phasellus tristique hendrerit vulputate. In hac habitasse platea dictumst. Nullam luctus nisi sit amet varius fermentum. Suspendisse eu facilisis dolor. Praesent mi ante, volutpat eu ex nec, accumsan faucibus justo.
Praesent ac orci a elit placerat tincidunt. Suspendisse potenti. Etiam volutpat leo lectus, vel feugiat nibh vestibulum et. Nulla dictum vel turpis id molestie. Nam sed ex nec turpis tempus consectetur. Morbi convallis, quam a laoreet molestie, purus enim euismod dui, id porttitor odio ipsum vitae quam. Cras accumsan ultricies nunc eu pretium. Donec fringilla facilisis sem feugiat suscipit.
Phasellus ut finibus massa. Integer vitae purus iaculis, fringilla mauris non, vehicula diam. Mauris eget metus sapien. Nulla sed nulla at purus mattis fermentum id ac erat. Ut vel ultricies nisl. Phasellus fermentum, felis nec laoreet lacinia, felis nunc pulvinar enim, eget bibendum erat augue eu turpis. Vestibulum ac urna commodo, sagittis metus nec, lacinia massa. Integer auctor pharetra leo vel eleifend. Nullam interdum libero vel massa fringilla mattis. Donec vel urna eget ligula efficitur finibus eu a purus. Donec vitae enim eros. Vivamus sit amet ipsum eget nisi pulvinar consectetur vel eu est. Fusce ex diam, dapibus a tempor luctus, euismod eu dolor. Morbi faucibus elit vitae ipsum commodo tincidunt.
Ut et blandit quam. Mauris ut rhoncus sapien, quis dignissim elit. Praesent sit amet augue eu tortor maximus consequat sit amet vel neque. Nulla scelerisque dui id pellentesque ultrices. Nulla ornare nisi turpis, et ornare erat bibendum vitae. Etiam blandit tellus in nunc viverra scelerisque. Sed dapibus nulla id imperdiet tincidunt. Curabitur at massa sit amet est rutrum congue. Fusce vitae augue feugiat, iaculis lacus non, dapibus magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec consequat ligula, at molestie augue. Sed accumsan dictum nisl, eu consectetur enim consequat`,
        date: new Date('12-01-2001').toISOString()  
      };


      let mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(mockReview.text + mockReview.id);
      let mockDbItem = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview, 
      };

      mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(reallyLongMockReview.text + reallyLongMockReview.id);
      let reallyLongMockDbItem = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: reallyLongMockReview, 
      };

      mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(reallyLongMockReview.text + reallyLongMockReview.id);
      let expectedDbItem = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: expectedReview, 
      };

      // Need to make a copy of our mockReview so truncateReviews doesn't modify the original
      let result = [Object.assign({}, mockDbItem), Object.assign({}, reallyLongMockDbItem)];
      handler.truncateReviews(result);

      assert.deepEqual(result, [mockDbItem, expectedDbItem]);

    });
  });
  describe('#createDynamoBatchRequest(items)', function() {
    it('should handle an empty list', function() {
      let expected = {
        RequestItems: {}
      };
      expected.RequestItems[TEST_TABLE] = [];

      assert.deepEqual(handler.createDynamoBatchRequest([]), expected);
    });
    it('should format the provided list into a DynamoDB batch request', function() {
      let mockReview1 = {
        id: 'abcd567',
        title: '',
        text: 'This is some review text.',
        date: new Date('12-01-2001').toISOString()
      };
      let mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(mockReview1.text + mockReview1.id);
      let mockDbItem1 = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview1, 
      };

      let mockReview2 = {
        id: '123456',
        title: 'Review Title',
        text: 'This is some other review text.',
        date: new Date('12-01-2001').toISOString()
      };
      mockReviewHash = crypto.createHash('sha256');
      mockReviewHash.update(mockReview2.text + mockReview2.id);
      let mockDbItem2 = {
        appIdStore: 'test id*test store',
        reviewHash: mockReviewHash.digest('hex'),
        date: new Date('12-01-2001').toISOString(),
        version: '1.0.0',
        review: mockReview2, 
      };
      let mockDbItems = [mockDbItem1, mockDbItem2];

      let expected = {
        RequestItems: {}
      };
      expected.RequestItems[TEST_TABLE] = [
        {
          PutRequest: {
            Item: mockDbItem1
          }
        },
        {
          PutRequest: {
            Item: mockDbItem2
          }
        }
      ];

      assert.deepEqual(handler.createDynamoBatchRequest(mockDbItems), expected);
    });
  });
});
