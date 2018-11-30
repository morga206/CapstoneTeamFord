'use strict';
let botToken;
const slackURL = 'https://slack.com/api/chat.postMessage';
const gatewayURL = process.env.GW_URL;
const stage = process.env.STAGE;

const aws = require('aws-sdk');
const axios = require('axios');

module.exports = {
  handler,
  buildParameters,
  sentimentOverTimeText,
  sentimentText,
  getAttitude,
  keywordText,
  report,
  getSentimentOverTime,
  extractSlackParameters
};

/**
 * Handler function that determines if a http request was invoked by scheduled report
 * @param event The event or request
 */
async function handler (event) {
  try {
    botToken = await getSSMParam('slackBotToken');
  } catch (error) {
    return {
      statusCode: 500,
      error: `Error getting bot token from SSM: ${error}`
    };
  }

  if (event.type === 'report') {
    try {
      await handleScheduledReport();
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error handling report: ${error}`
      };
    }

  } else if (event.type === 'command') {
    try {
      await handleCommand(event.request);
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error handling command: ${error}`
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
 * Get a value from the SSM parameter store
 */
async function getSSMParam(name) {
  const ssm = new aws.SSM();

  const params = {
    Name: name,
    WithDecryption: true
  };

  let response;

  try {
    response = await ssm.getParameter(params).promise();
  } catch (error) {
    console.log(`Error getting parameter ${name}: ${error}`);
    throw error;
  }

  return response.Parameter.Value;
}

/**
 * Handles any slash commands and posts the message(s) to the response URL
 * @param slackFields The JSON object, body of the slack /command
 */
async function handleCommand(slackFields){
  const responseURL = slackFields['response_url'];
  const parameters = await extractSlackParameters(slackFields);

  // Get a list of statistics for given parameters
  let statsList;
  try {
    statsList = await getStatistics(parameters);
  } catch (error) {
    console.log(`Error generating the statistics for a /command: ${error}`);
    throw error;
  }

  // Determine which command was triggered and get the report to send to slack
  let slackResponses;
  switch (slackFields.command) {
  case '/getlatestreviews':
    try {
      slackResponses = await report(statsList);
    } catch (error) {
      console.log(`Error processing /command getLatestReviews: ${error}`);
      throw error;
    }
    break;
  case '/getreviews':
    try {
      slackResponses = await report(statsList);
    } catch (error) {
      console.log(`Error processing /command getReviews: ${error}`);
      throw error;
    }
    break;
  case '/getsentimentovertime':
    try {
      slackResponses = await getSentimentOverTime(statsList);
    } catch (error) {
      console.log(`Error processing /command getSentimentOverTime: ${error}`);
      throw error;
    }
    break;
  case '/sentimenthelp':
    slackResponses = await getSentimentHelp();
  }

  // Post messages to slack
  for (let message in slackResponses) {
    slackResponses[message].response_type = 'in_channel';
    let response = await axios.post(responseURL, slackResponses[message]);

    if (response.ok == false) {
      const error = response.error;
      console.log(`Error posting messages to slack: ${error}`);
      throw error;
    }
  }

}

/**
 * Function extracts the passed parameters from the slack request sent when a slash command is invoked
 * @param slackFields The JSON object that contains response URL and text for a slash command
 * @returns parameters The parameters passed by user from slack or an empty JSON object otherwise
 */
async function extractSlackParameters(slackFields) {
  let parameters = {};

  // Parse the slack message text for optional or required parameters from user input
  if (slackFields.text.trim() != '') {
    const userInput = slackFields.text.split(' ');

    for (let parameter in userInput) {
      const pair = userInput[parameter].split('=');
      parameters[pair[0]] = pair[1];
    }
  }

  return parameters;
}

/**
 * Function gets the statistics for both app stores
 * over the last 7 days, for the latest version
 * and builds formatted messages to post to slack
 */
async function handleScheduledReport() {
  let statsList;
  try {
    statsList = await getStatistics();  // Get the statistics with default values
  } catch (error) {
    console.log(`Error generating the statistics for the scheduled report: ${error}`);
    throw error;
  }

  let slackResponse;
  try {
    slackResponse = await report(statsList);  // Create the message to post to slack
  } catch (error) {
    console.log(`Error generating the scheduled report for slack: ${error}`);
    throw error;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${botToken}`
  };

  // Post all of the reports to slack
  for (let message in slackResponse) {
    let response = await axios.post(slackURL, slackResponse[message], { headers: headers });

    if (response.ok == false) {
      const error = response.error;
      console.log(`Error posting messages to slack: ${error}`);
      throw error;
    }
  }


}

/**
 * Function gets list of statistics with any parameters passed
 * @param parameters The JSON object with any optional or required parameters
 * @returns statsList The list of statistics for each specified version of an app
 */
async function getStatistics(parameters={}){
  const endpoint = gatewayURL + '/stats';
  let statisticsList = [];

  // Specify Apple, Google or both app stores
  let store = 'both';
  if (parameters.hasOwnProperty('store')) {
    store = parameters['store'].toLowerCase();
  }

  // Get the apps for specified store(s)
  let apps;
  try {
    apps = await getApps(store);
  } catch (error) {
    throw error;
  }

  // Build a list of parameters to request stats for
  const statsRequests = await buildParameters(apps, parameters);

  // Create a list of promises to await the statistics response
  let promises = [];
  for (let request in statsRequests) {
    const promise = axios.post(endpoint, statsRequests[request]);
    promises.push(promise);
  }

  const allPromises = Promise.all(promises);
  let statistics = [];

  // Await all of the statistics responses
  try {
    statistics = await allPromises;
  } catch(error) {
    console.log(`Error awaiting /stats requests: ${error}`);
    throw error;
  }

  // Add in app names to statistics
  for (let i = 0; i < statistics.length; i++) {
    const appName = apps[statistics[i].data.appIdStore].name;
    statistics[i].data.name = appName;
    statisticsList.push(statistics[i].data);
  }

  return statisticsList;

}

/**
 * Gets the apps for specified store or defaults to both stores
 * @param store The app store to get apps for (defaults to both unless specified)
 * @returns filteredApps The JSON object with appIdStore as the key and name, dates and versions as values
 */
async function getApps(store='both') {
  const endpoint = gatewayURL + '/apps';

  // Request to /apps endpoint for all apps
  let appsRequest;
  try {
    appsRequest = await axios.get(endpoint);
  } catch (error) {
    console.log(`Error getting apps from endpoint: ${error}`);
    throw error;
  }

  const apps = appsRequest.data;
  let filteredApps = {};

  // Depending on specified store, filter the apps we want a report for
  if (store == 'both') {
    for (let appIdStore in apps.apps) {
      if (apps.apps[appIdStore].slackReport) {
        filteredApps[appIdStore] = apps.apps[appIdStore];
      }
    }

  } else if (store.includes('google') || store.includes('android')) {
    for (let appIdStore in apps.apps) {
      if (apps.apps[appIdStore].slackReport && appIdStore.includes('Google Play')) {
        filteredApps[appIdStore] = apps.apps[appIdStore];
      }
    }

  } else if (store.includes('apple') || store.includes('ios')) {
    for (let appIdStore in apps.apps) {
      if (apps.apps[appIdStore].slackReport && appIdStore.includes('App Store')) {
        filteredApps[appIdStore] = apps.apps[appIdStore];
      }
    } 
  }

  return filteredApps;
}

/**
 * Function takes the apps and slackInput and builds the parameters to request stats for
 * @param apps The JSON object of all of the apps already filtered by store
 * @param slackInput The potential user supplied arguments
 * @returns statsRequests The array of parameters to get stats for
 */
function buildParameters(apps, slackInput) {
  let statsRequests = [];

  // Determine the value to use for days
  for (let app in apps) {
    let days;
    if (slackInput.hasOwnProperty('days')) {
      days = slackInput.days;
    } else {
      days = 7;
    }

    // Calculate date range using days or defaulting to 7 days back from latest available
    let startDate;
    let endDate;
    if (slackInput.hasOwnProperty('startDate') && slackInput.hasOwnProperty('endDate')) {
      startDate = new Date(slackInput.startDate);
      endDate = new Date(slackInput.endDate);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
    }

    // Either use specified version or default to latest version
    let version;
    if (slackInput.hasOwnProperty('version')) {
      version = slackInput.version;
    } else {
      version = apps[app].versions[apps[app].versions.length - 1];
    }

    // Parameters to make request to stats endpoint
    const params = {
      'appIdStore': app,
      'version': version,
      'startDate': startDate.toISOString(),
      'endDate': endDate.toISOString(),
      'stats': [{
        'sentimentOverTime': null
      }, {
        'keywords': null
      }, {
        'overallSentiment': null
      }, {
        'rawReviews': null
      }, {
        'numReviews': null
      }]
    };

    statsRequests.push(params);
  }

  return statsRequests;
}

/**
 * Create a report of messages to send to slack for given statistics
 * @param statistics The list of statistics to craft a slack message with
 * @return slackMessages The list of slack messages to post to a slack channel
 */
async function report(statistics){
  let slackMessages = []; // List of reports to send to slack as messages (One report per app)

  let channel;
  try {
    channel = '#' + await getSSMParam(`postingChannel-${stage}`);
  } catch (error) {
    throw error;
  }

  // report represents the index in statistics list
  for (let i = 0; i < statistics.length; i++) {
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
    const stats = statistics[i];

    const overallSentiment = stats.overallSentiment;
    const keywords = stats.keywords;
    const version = stats.version;
    const name = stats.name;
    const numReviews = stats.numReviews;
    const startDate = stats.sentimentOverTime.labels[0];
    const endDate = stats.sentimentOverTime.labels[stats.sentimentOverTime.labels.length-1];

    const attitude = await getAttitude(overallSentiment);

    // Build the slack message to send back with attachments
    message += `Report for:\nApp: ${name}\nVersion: ${version}\n`;
    message += `Between ${startDate} and ${endDate}, sentiment has been mostly ${attitude} for ${numReviews} `;

    if (numReviews == 1) {
      message += 'review';
    } else {
      message += 'reviews';
    }

    slackAttachments[0].text = await sentimentText(overallSentiment);
    slackAttachments[1].text = await keywordText(keywords.positive);
    slackAttachments[2].text = await keywordText(keywords.negative);

    let params = {
      text: message,
      attachments: slackAttachments,
      channel: channel
    };

    slackMessages.push(params);
  }

  return slackMessages;
}

/**
 * Creates a report of messages to send to slack for sentiment by day
 * @param statistics The list of statistics to output to slack
 * @return slackMessages The list of slack messages to send to a slack channel
 */
async function getSentimentOverTime(statistics){
  let slackMessages = [];

  // report represents the index in statistics list
  for (let i = 0; i < statistics.length; i++) {
    let message = '';
    let attachments = [
      {
        'fallback': 'Sentiment Over Time',
        'color': '#ff5c22',
        'title': 'Percentage of negative reviews by day',
      }
    ];

    // Get the fields we want to use in our message to slack
    const stats = statistics[i];

    const overallSentiment = stats.overallSentiment;
    const sentimentOverTime = stats.sentimentOverTime;
    const data = sentimentOverTime.data;
    const labels = sentimentOverTime.labels;
    const totals = sentimentOverTime.totals;
    const startDate = stats.sentimentOverTime.labels[0];
    const endDate = stats.sentimentOverTime.labels[stats.sentimentOverTime.labels.length-1];
    const numReviews = stats.numReviews;

    const attitude = await getAttitude(overallSentiment);

    // Build the slack message to send back with attachments
    message += `Report for:\nApp: ${stats.name}\nVersion: ${stats.version}\n`;
    message += `Between ${startDate} and ${endDate}, sentiment has been mostly ${attitude} for ${numReviews} `;

    if (numReviews == 1) {
      message += 'review';
    } else {
      message += 'reviews';
    }

    attachments[0].text = await sentimentOverTimeText(data, labels, totals);

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
 * @param data: the percentages of negative reviews
 * @param labels: the month, day labels for the data
 * @param totals: the total number of reviews for that day
 * @returns text: the text attachment for sentimentOverTime
 */
async function sentimentOverTimeText(data, labels, totals) {
  let text = '';
  for (let day in data) {
    const date =  labels[day];

    // data[day] * 100 / 100 for rounding to the 2nd digit after the decimal
    const percent = Math.round(data[day]*100)/100;
    const total = totals[day];

    if (data[day] != null) {
      text += `On ${date}, ${percent}% of reviews were negative: ${total} total `;

      if (total == 1) {
        text += 'review\n';
      } else {
        text += 'reviews\n';
      }
    }
  }

  return text;
}

/**
 * Builds the text string for sentiment scores
 * @param overallSentiment The overall sentiment scores for pos, neg, neutral, mixed
 * @returns text The string for the sentiment scores
 */
async function sentimentText(overallSentiment) {
  const sentiment = [Math.round(overallSentiment.POSITIVE),
    Math.round(overallSentiment.NEGATIVE),
    Math.round(overallSentiment.MIXED),
    Math.round(overallSentiment.NEUTRAL)];

  const text = `Positive: ${sentiment[0]}%\nNegative: ${sentiment[1]}%\nMixed: ${sentiment[2]}%\nNeutral: ${sentiment[3]}%`;

  return text;
}

/**
 * Builds the text string for the keywords to display in a slack message
 * @param keywords The JSON object of keywords with words and percentage of reviews word appears in
 * @returns text The text string for the keywords
 */
async function keywordText(keywords) {
  let text = '';

  for (let word in keywords) {
    text += `${keywords[word].keyword}: ${Math.round(keywords[word].percentage*100)/100}%\n`;
  }

  return text;
}

/**
 * Gets attitude using overallSentiment to find max attitude
 * @param overallSentiment The scores for each sentiment rating
 * @returns attitude The most common sentiment score
 */
async function getAttitude(overallSentiment) {
  // Determine the actual sentiment values as percentages
  const sentiment = [Math.round(overallSentiment.POSITIVE), Math.round(overallSentiment.NEGATIVE), Math.round(overallSentiment.MIXED), Math.round(overallSentiment.NEUTRAL)];
  const max = Math.max(...sentiment);

  // Determine the maximum attitude
  let attitude;
  switch (max) {
  case sentiment[0]:
    attitude = 'Positive';
    break;
  case sentiment[1]:
    attitude = 'Negative';
    break;
  case sentiment[2]:
    attitude = 'Mixed';
    break;
  case sentiment[3]:
    attitude = 'Neutral';
  }

  return attitude;
}


/**
 * Crafts a help message describing function use and optional / required parameters
 * @returns messageList The list with one item, the help message to post to slack
 */
async function getSentimentHelp() {
  let message = 'Available Functions and how to use them are below';

  // Use of slack attachments to format the message
  let attachments = [{}, {}, {}];
  attachments[0] = {
    'fallback': 'getLatestReviews Help',
    'color': '#0066ff',
    'title': '/getLatestReviews',
    'text':  'Description: Gets the most recent review sentiment for apps from both stores unless specified\n',
    'fields': [
      {
        'title': 'Optional Parameters',
        'value': 'days (default 7)\nstore (defaults to both)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getlatestreviews\n/getlatestreviews store=google\n/getlatestreviews days=4 store=android',
        'short': false
      }
    ]
  };

  attachments[1] = {
    'fallback': 'getReviews Help',
    'color': '#f3ff2b',
    'title': '/getReviews',
    'text':  'Description: Gets the sentiment of apps over a time period for a specific version\n',
    'fields': [
      {
        'title': 'Required Parameters',
        'value': 'startDate: (11/5/2018)\nendDate: (11/12/2018)\nversion: (2.4.1)',
        'short': false
      },
      {
        'title': 'Optional Parameters',
        'value': 'store (android/apple)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getreviews startDate=10/30/2018 endDate=11/5/2018 version=2.4.1',
        'short': false
      }
    ]
  };

  attachments[2] = {
    'fallback': 'getSentimentOverTime Help',
    'color': '#184d1d',
    'title': '/getSentimentOverTime',
    'text':  'Description: Gets the percentage of negative reviews per day given dates\n',
    'fields': [
      {
        'title': 'Optional Parameters',
        'value': 'store (android/google or )\nversion: (defaults to latest)\nstartDate: (10/3/2018)\nendDate: (11/17/2018)',
        'short': false
      },
      {
        'title': 'Example use cases',
        'value': '/getSentimentOverTime startDate=10/30/2018 endDate=11/5/2018 version=2.4.1 store=ios',
        'short': false
      }
    ]
  };

  const params = {
    text: message,
    attachments: attachments
  };

  // create a list so that all /commands are handled the same
  let messageList = [params];
  return messageList;
}