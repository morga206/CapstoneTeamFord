'use strict';
var assert = require('assert');

var worker = require('../worker');

describe('worker', function() {

  describe('#buildParameters(apps, slackInput)', function() {
    const mockApps = {
      'mockApp1*mockStore': {

      },
      'mockApp2*mockStore': {

      },
      'mockApp3*mockStore': {

      }
    };
    it('should build a list of parameters for each app', async () => {
      const mockSlackInput = {
        'startDate': '1/1/2018',
        'endDate': '12/31/2018',
        'version': '1.2.3'
      };
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i++) {
        assert.equal(parameters[i].appIdStore, `mockApp${i+1}*mockStore`);
      }
    });
    it('should build a list of parameters with the version given from slack', async () => {
      const mockSlackInput = {
        'startDate': '1/1/2018',
        'endDate': '12/31/2018',
        'version': '1.2.3'
      };
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i ++) {
        assert.equal(parameters[i].version, '1.2.3');
      }
    });
    it('should include the date range in ISO form in the parameters', async () => {
      const startDate = '1/1/2018';
      const endDate = '12/31/2018';
      const mockSlackInput = {
        'startDate': startDate,
        'endDate': endDate,
        'version': '1.2.3'
      };
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i ++) {
        assert.equal(parameters[i].startDate, new Date(startDate).toISOString());
        assert.equal(parameters[i].endDate, new Date(endDate).toISOString());
      }
    });
    it('should use days to calculate n days from a date', async () => {
      // Create a mock date 11 days ago for testing
      let testDate = new Date();
      testDate.setDate(testDate.getDate() - 11);
      testDate = testDate.toISOString();

      const mockSlackInput = {
        'days': 11,
        'version': '1.2.3'
      };
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);

      // Slicing from 0-11 to compare just the year-day-month and not seconds
      for (let i = 0; i < 3; i++) {
        assert.equal(testDate.slice(0,11), parameters[i].startDate.slice(0,11));
      }
    });
  });

  describe('#sentimentOverTimeText(data, labels, totals', function() {
    it('should build text for a part of a report for each day with rounded numbers', async () => {
      const mockLabels = ['November 1','November 2','November 3', 'November 4'];
      const mockData = [100,18.75,86.13861386,65.82278481];
      const mockTotals = [4,16,101,79];

      let mockText = await worker.sentimentOverTimeText(mockData, mockLabels, mockTotals);
      const expectedText = 'On November 1, 100% of reviews were negative: 4 total reviews\n' +
          'On November 2, 18.75% of reviews were negative: 16 total reviews\n' +
          'On November 3, 86.14% of reviews were negative: 101 total reviews\n' +
          'On November 4, 65.82% of reviews were negative: 79 total reviews\n';
      assert.equal(mockText, expectedText)
    });
    it('should ignore null values in the data', async () => {
      const mockLabels = ['November 1','November 2','November 3', 'November 4'];
      const mockData = [100,18.75,null,65.82278481];
      const mockTotals = [4,16,null,79];

      let mockText = await worker.sentimentOverTimeText(mockData, mockLabels, mockTotals);
      const expectedText = 'On November 1, 100% of reviews were negative: 4 total reviews\n' +
          'On November 2, 18.75% of reviews were negative: 16 total reviews\n' +
          'On November 4, 65.82% of reviews were negative: 79 total reviews\n';

      assert.equal(mockText, expectedText);
    });
  });

  describe('#sentimentText(overallSentiment)', function() {
    const mockSentiment = {
      POSITIVE: 42.23423,
      NEGATIVE: 14.0539,
      MIXED: 24.8242,
      NEUTRAL: 19.00014
    };
    it('should build text for the sentiment portion of a report', async () => {
      let mockText = await worker.sentimentText(mockSentiment);
      const expectedText = 'Positive: 42%\nNegative: 14%\nMixed: 25%\nNeutral: 19%';
      assert.equal(mockText, expectedText);
    });
  });

  describe('#getAttitude(overallSentiment)', function() {
    const mockSentiment = {
      POSITIVE: 42.23423,
      NEGATIVE: 14.0539,
      MIXED: 24.8242,
      NEUTRAL: 19.00014
    };
    it('should return a capitalized string of the maximum sentiment value', async () => {
      let mockAttitude = await worker.getAttitude(mockSentiment);
      assert.equal(mockAttitude, 'Positive');
    });
  });

  describe('#keywordText(keywords)', function() {
    const mockKeywords = {
      0: {
        keyword: 'some feature',
        percentage: 5.9482
      },
      1: {
        keyword: 'best app',
        percentage: 4.5386
      },
      2: {
        keyword: 'no problems',
        percentage: 4.5386
      },
      3: {
        keyword: 'mock keyword',
        percentage: 2.999
      }
    };
    it('should build the text to display keywords and percentages in slack', async () => {
      let mockText = await worker.keywordText(mockKeywords);
      const expectedText = 'some feature: 5.95%\n' +
          'best app: 4.54%\n' +
          'no problems: 4.54%\n' +
          'mock keyword: 3%\n';
      assert.equal(mockText, expectedText);
    });

  });
  describe('#extractSlackParameters(slackFields)', function () {
    it('should return a dictionary with the parsed fields from text as key, value pairs', async () => {
      const mockSlackFields = {
        text: 'key=value startDate=yesterday endDate=today'
      };
      const expectedFields = {
        'key': 'value',
        'startDate': 'yesterday',
        'endDate': 'today'
      }
      let slackParameters = await worker.extractSlackParameters(mockSlackFields);
      for (let key in slackParameters) {
        assert.equal(slackParameters[key], expectedFields[key]);
      }
    });
    it('should return an empty dictionary if text has no content (trimming whitespace)', async () => {
      const mockSlackFields = {
        text: '               '
      };
      let slackParameters = await worker.extractSlackParameters(mockSlackFields);
      assert.equal(Object.keys(slackParameters).length, 0);
    });
  });

  describe('#getSentimentOverTime(statistics)', function () {
    it('should create a list of parameters including messages to send to slack', async () => {
      const mockStatistics = [
        {
          name: 'mockApp*mockStore',
          version: '1.0.0',
          rawReviews: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
          overallSentiment: {
            POSITIVE: 57.69230769,
            NEGATIVE: 25.64102564,
            NEUTRAL: 5.12820513,
            MIXED: 11.53846154
          },
          sentimentOverTime: {
            data: [66.6666, 10, 75, 11.111111],
            labels: ['September 4','September 5','September 6','September 7'],
            totals: [45, 20, 4, 9]
          }
        }
      ];
      let sentimentOverTime = await worker.getSentimentOverTime(mockStatistics);
      const expectedText = 'Report for:\nApp: mockApp*mockStore\nVersion: 1.0.0\n' +
          'Between September 4 and September 7, sentiment has been mostly Positive' +
          ' for 16 reviews';
      const expectedAttachments = 'On September 4, 66.67% of reviews were negative: 45 total reviews\n' +
          'On September 5, 10% of reviews were negative: 20 total reviews\n' +
          'On September 6, 75% of reviews were negative: 4 total reviews\n' +
          'On September 7, 11.11% of reviews were negative: 9 total reviews\n';
      assert.equal(sentimentOverTime.length, 1);
      assert.equal(sentimentOverTime[0].text, expectedText);
      assert.equal(sentimentOverTime[0].attachments[0].text, expectedAttachments);
    });
  });

});
