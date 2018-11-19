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
    const mockSlackInput = {
      'startDate': '1/1/2018',
      'endDate': '12/31/2018',
      'version': '1.2.3'
    };
    it('should build a list of parameters for each app', async () => {
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i++) {
        assert.equal(parameters[i].appIdStore, `mockApp${i+1}*mockStore`);
      }
    });
    it('should build a list of parameters with the version given from slack', async () => {
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i ++) {
        assert.equal(parameters[i].version, '1.2.3');
      }
    });
    it('should include the date range in ISO form in the parameters', async () => {
      let parameters = await worker.buildParameters(mockApps, mockSlackInput);
      for (let i = 0; i < 3; i ++) {
        assert.equal(parameters[i].startDate, '2018-01-01T05:00:00.000Z');
        assert.equal(parameters[i].endDate, '2018-12-31T05:00:00.000Z');
      }
    });
  });

  describe('#sentimentOverTimeText(data, labels, totals', function() {
    const mockLabels = ['November 1','November 2','November 3', 'November 4'];
    const mockData = [100,18.75,86.13861386,65.82278481];
    const mockTotals = [4,16,101,79];
    it('should build text for a part of a report for each day with rounded numbers', async () => {
      let mockText = await worker.sentimentOverTimeText(mockData, mockLabels, mockTotals);
      const expectedText = 'On November 1, 100% of reviews were negative: 4 total reviews\n' +
          'On November 2, 18.75% of reviews were negative: 16 total reviews\n' +
          'On November 3, 86.14% of reviews were negative: 101 total reviews\n' +
          'On November 4, 65.82% of reviews were negative: 79 total reviews\n';
      assert.equal(mockText, expectedText)
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
      const expectedText = 'Positive: 42%\nNegative: 14%\nNeutral: 19%\nMixed: 25%';
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


});
