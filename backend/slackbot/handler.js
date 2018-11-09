'use strict';
const hook = 'https://hooks.slack.com/services/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'; // group slack
const gatewayURL = process.env.GW_URL;
const axios = require('axios');
const queryString = require('query-string');

module.exports = {
  handler,
};

/** Handler function that determines if a http request was invoked by scheduled report
 *
 * @param event: the event or request
 */
async function handler (event) {
  if (event.hasOwnProperty('detail-type')) {

    try {
      await handleScheduledReport();
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error handling scheduled report: ${error}`
      };
    }

  } else if (event.hasOwnProperty('httpMethod')) {

    try {
      await handleHttpRequest(event);
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error handling httpRequest: ${error}`
      };
    }

  } else {

    return {
      statusCode: 500,
      error: 'Error, Unrecognized event type'
    };
  }

  return {
    statusCode: 200
  };

}

/**
 * Function takes in an httpEvent and determines
 * if it is a get request or slash command (post request)
 *
 * @param httpEvent the http JSON formatted event
 */
async function handleHttpRequest(httpEvent) {
  if (httpEvent.httpMethod === 'POST') {
    const requestBody = queryString.parse(httpEvent.body);
    await handleCommand(requestBody);
  } else {
    await handleScheduledReport();
  }

}

/**
 * Handles any slash commands and posts the message(s) to the response URL
 *
 * @param slackFields: The JSON object, body of the slack /command
 */
async function handleCommand(slackFields){
  let slackResponses = []; // List of messages sending to slack
  let parameters = {};

  // Parse the slack message text for optional or required parameters from user input
  const userInput = slackFields.text.split(' ');
  for (let parameter in userInput) {
    let pair = userInput[parameter].split('=');
    parameters[pair[0]] = pair[1];
  }

  const statsList = getStatistics(parameters);

  // Determine which command should be invoked
  switch (slackFields.command) {
    case 'getlatestreviews':
      slackResponses = await report(statsList);
    case 'getreviews':
      slackResponses = await report(statsList);
    case 'getsentimentovertime':
      slackResponses = await getSentimentOverTime(statsList);
    case 'sentimenthelp':
      slackResponses = await getSentimentHelp();
  }

  // Post messages to slack
  for (let message in slackResponses) {
    await axios.post(hook, slackResponses[message]);
  }

}

/**
 * Function gets the statistics for both app stores
 * over the last 7 days, for the latest version
 * and builds formatted messages to post to slack
 */
async function handleScheduledReport() {
  const statsList = getStatistics();  // Get the statistics with default values

  const slackResponse = report(statsList);  // Create the message to post to slack

  // Post all of the reports to slack
  for (let message in slackResponse) {
    await axios.post(hook, slackResponse[message]);
  }
}

/** Function gets list of statistics with any parameters passed
 *
 * @param parameters any optional or required parameters passed
 * @returns statsList a list of statistics for each specified version of an app
 */
async function getStatistics(parameters={}){;
  const endpoint = gatewayURL + '/stats'
  let statisticsList = [];

  // Apple, Google or both app stores
  let store = 'both';
  if (parameters.hasOwnProperty('store')) {
    store = parameters['store'].toLowerCase();
  }

  // Get the apps for specified stores
  const apps = await getApps(store);
  const statsRequests = buildParameters(apps, parameters); // Get list of parameters to post a report for each app

  // Create a list of promises to await the statistics response
  let promises = [];
  for (let request in statsRequests) {
    promises.push(axios.post(endpoint, statsRequests[request]))
  }

  let allPromises = Promise.all(promises);
  let statistics = [];

  try {
    statistics = await allPromises;
  } catch(error) {
    throw error;
  }

  // Add in app names to statistics
  for (let i = 0; i < statistics.length; i++) {
    statistics[i].data.name = apps[statistics[i].data.appIdStore].name;
    statisticsList.push(statistics[i].data)
  }

  return statisticsList;

}

/** Gets the apps for specified store or defaults to both stores
 *
 * @param store: The app store to get apps for (defaults to both unless specified)
 * @returns returns filteredApps: JSON object with appIdStore as the key and name, dates and versions as values
 */
async function getApps(store='both') {
  const endpoint = gatewayURL + '/apps';
  let filteredApps = {};  // apps we want to return depending on store specified

  const appsRequest = await axios.get(endpoint); // Get list of available apps
  const apps = appsRequest.data;

  if (store == 'both') {
    return apps;
  } else {
    // Filter apps based on appStoreId and user provided store
    for (let appIdStore in apps) {
      if ( (store.includes('google') || store.includes('android')) && appIdStore.includes('Google Play') ) {
        filteredApps[appIdStore] = apps[appIdStore];
      }
      else if ( (store.includes('apple') || store.includes('ios')) && appIdStore.includes('App Store') ) {
        filteredApps[appIdStore] = apps[appIdStore];
      }
    }
  }

  return filteredApps;
}

/**
 * Function takes the apps and slackInput and builds the parameters to request stats for
 *
 * @param apps: all of the apps already filtered by store we want statistics for
 * @param slackInput: potential user supplied arguments
 * @returns statsRequests: array of parameters to get stats for
 */
function buildParameters(apps, slackInput) {
  let statsRequests = [];

  for (let app in apps) {
    let params = {};

    let days = 7;
    if (slackInput.hasOwnProperty('days')) {
      days = slackInput.days;
    }

    // Calculate date range using days or defaulting to 7 days back from latest available
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    if (slackInput.hasOwnProperty('startDate')) {
      startDate = slackInput.startDate;
    }

    if (slackInput.hasOwnProperty('endDate')) {
      endDate = slackInput.endDate;
    }

    // Either use specified version or default to latest version
    let version = apps[app].versions[apps[app].versions.length - 1];
    if (slackInput.hasOwnProperty('version')) {
      version = slackInput.version;
    }

    // Parameters to make request to stats endpoint
    params = {
      'appIdStore': app,
      'version': version,
      'startDate': startDate,
      'endDate': endDate,
      'stats': [{
        'sentimentOverTime': null
      }, {
        'keywords': null,
      }, {
        'overallSentiment': null,
      }, {
        'rawReviews': null
      }]
    };

    statsRequests.push(params);
  }

  return statsRequests;
}

/** Create a report of messages to send to slack for given statistics
 *
 * @param statistics: list of statistics to craft a slack message with
 * @return slackMessages: list of slack messages to post to slack channel
 */
async function report(statistics){
  let slackMessages = []; // List of reports to send to slack as messages (One report per app)

  // report represents the index in statistics list
  for (let report in statistics) {
    let message = '';
    let slackAttachments = [
      {'fallback': 'Overall Sentiment',
        'color': '#0066ff',
        'title': 'Overall Sentiment',
      },
      {'fallback': 'Positive Keywords',
        'color': '#36a64f',
        'title': 'Keywords in Positive Reviews'
      },
      {'fallback': 'Negative Keywords',
        'color': '#ff0000',
        'title': 'Keywords in Negative Reviews'
      }
    ];

    // Get fields from statsList to send in messages
    let statsList = statistics[report];

    let overallSentiment = statsList.overallSentiment;
    let rawReviews = statsList.rawReviews;
    let keywords = statsList.keywords;
    let version = statsList.version;
    let name = statsList.name;
    let startDate = statsList.sentimentOverTime.labels[0];
    let endDate = statsList.sentimentOverTime.labels[statsList.sentimentOverTime.labels.length-1];

    const attitude = getAttitude(overallSentiment);

    // Build the slack message to send back with attachments
    message += `Report for:\nApp: ${name}\nVersion: ${version}\n`;
    message += `Between ${startDate} and ${endDate}, sentiment has been mostly ${attitude} for ${Object.keys(rawReviews).length} reviews`;

    slackAttachments[0].text = sentimentText(overallSentiment);
    slackAttachments[1].text = keywordText(keywords.positive);
    slackAttachments[2].text = keywordText(keywords.negative);

    let params = {
      text: message,
      attachments: slackAttachments
    };

    slackMessages.push(params);
  }

  return slackMessages;
}

/** Creates a report of messages to send to slack for sentiment by day
 *
 * @param statistics list of statistics to output to slack
 * @return
 */
async function getSentimentOverTime(statistics){
  let slackMessages = [];

  // report represents the index in statistics list
  for (let report in statistics) {
    let message = '';
    let attachments = [
      {
        'fallback': 'Sentiment Over Time',
        'color': '#0066ff',
        'title': 'Percentage of positive reviews by day',
      }
    ];

    // Get the fields we want to use in our message to slack
    let stats = statistics[report];
    let sentimentOverTime = stats.sentimentOverTime;
    let overallSentiment = stats.overallSentiment;

    let data = sentimentOverTime.data;
    let labels = sentimentOverTime.labels;

    let startDate = stats.sentimentOverTime.labels[0];
    let endDate = stats.sentimentOverTime.labels[stats.sentimentOverTime.labels.length-1];

    const attitude = getAttitude(overallSentiment);

    // Build the slack message to send back with attachments
    message += `Report for:\nApp: ${stats.name}\nVersion: ${stats.version}\n`;
    message += `Between ${startDate} and ${endDate}, sentiment has been mostly ${attitude} for ${Object.keys(stats.rawReviews).length} reviews`;

    attachments[0].text = sentimentOverTimeText(data, labels);

    let params = {
      text: message,
      attachments: attachments
    };

    slackMessages.push(params);

  }

  return slackMessages;
}

/**
 * Helper function to build the text that matches days to percentage of negative reviews
 *
 * @param data: the percentages of negative reviews
 * @param labels: the month, day labels for the data
 * @returns text: the text attachment for sentimentOverTime
 */
async function sentimentOverTimeText(data, labels) {
  let text = '';
  for (let day in data) {
    let date =  labels[day];
    let percent = Math.round(data[day]*100)/100;

    if (data[day] != null) {
      text += `On ${date}, ${percent}% of reviews were negative\n`;
    }
  }

  return text;
}

/** Builds the text string for sentiment scores
 *
 * @param overallSentiment: the overall sentiment scores for pos, neg, neutral, mixed
 * @returns text: string that will display the actual sentiment scores
 */
async function sentimentText(overallSentiment) {
  const sentiment = [Math.round(overallSentiment.POSITIVE),
    Math.round(overallSentiment.NEGATIVE),
    Math.round(overallSentiment.MIXED),
    Math.round(overallSentiment.NEUTRAL)];

  let text = `Positive: ${sentiment[0]}%\nNegative: ${sentiment[1]}%\nNeutral: ${sentiment[2]}%\nMixed: ${sentiment[3]}%`;

  return text;
}

/** Builds the text string for the keywords to display in a slack message
 *
 * @param keywords: keyword objects with words and percentage of reviews word appears in
 * @returns text: text string for the kwywords
 */
async function keywordText(keywords) {
  let text = '';

  for (let word in keywords) {
    text += `${keywords[word].keyword}: ${Math.round(keywords[word].percentage*100)/100}%\n`;
  }

  return text;
}

/** Gets attitude using overallSentiment to find max attitude
 *
 * @param overallSentiment: the scores for each sentiment rating
 * @returns attitude: string of attitude as positive, negative, neutral or mixed
 */
async function getAttitude(overallSentiment) {
  // Determine the actual sentiment values as percentages
  const sentiment = [Math.round(overallSentiment.POSITIVE), Math.round(overallSentiment.NEGATIVE), Math.round(overallSentiment.MIXED), Math.round(overallSentiment.NEUTRAL)];
  const max = Math.max(...sentiment);

  // Determine the maximum attitude
  let attitude = '';
  switch (max) {
    case sentiment[0]:
      attitude = 'Positive';
    case sentiment[1]:
      attitude = 'Negative';
    case sentiment[2]:
      attitude = 'Mixed';
    case sentiment[3]:
      attitude = 'Neutral';
  }

  return attitude;
}


/** Crafts a help message describing function use and optional / required parameters
 *
 * @returns messageList: list with one item, the help message to post to slack
 */
async function getSentimentHelp() {
  let message = 'Available Functions and how to use them are below';

  // Use of slack attachments to format the message
  let attachments = [{}, {}, {}];
  attachments[0] = {
    'fallback': 'getReviews Help',
    'color': '#0066ff',
    'title': '/getReviews',
    'text':  'Description: Gets the review sentiment and common keywords for an app or list of apps\n',
    'fields': [
      {
        'title': 'Optional Parameters',
        'value': 'days (default 7)\nstore (defaults to both)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getreviews\n/getreviews store=google\n/getreviews days=4 store=android',
        'short': false
      }
    ]
  };

  attachments[1] = {
    'fallback': 'getLatestReviews Help',
    'color': '#f3ff2b',
    'title': '/getLatestReviews',
    'text':  'Description: Gets the most recent review sentiment and common keywords for an app or list of apps\n',
    'fields': [
      {
        'title': 'Required Parameters',
        'value': 'startDate: (mm/dd/yyyy)\nendDate: (mm/dd/yyyy)\nversion: (2.4.1)',
        'short': false
      },
      {
        'title': 'Optional Parameters',
        'value': 'store (defaults to both)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getlatestreviews startDate=10/30/2018 endDate=11/5/2018 version=2.4.1',
        'short': false
      }
    ]
  };

  attachments[2] = {
    'fallback': 'getSentimentOverTime Help',
    'color': '#184d1d',
    'title': '/getSentimentOverTime',
    'text':  'Description: Gets the percentage of positive reviews per day given dates\n',
    'fields': [
      {
        'title': 'Required Parameters',
        'value': 'startDate: (mm/dd/yyyy)\nendDate: (mm/dd/yyyy)',
        'short': false
      },
      {
        'title': 'Optional Parameters',
        'value': 'store (android/google or )\nversion: (defaults to latest)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getSentimentOverTime startDate=10/30/2018 endDate=11/5/2018 version=2.4.1 store=ios',
        'short': false
      }
    ]
  };

  let params = {
    text: message,
    attachments: attachments
  };

  // create a list so that all /commands are handled the same
  let messageList = [params];
  return messageList;
}