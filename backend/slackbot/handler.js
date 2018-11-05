'use strict';
//const hook = 'https://hooks.slack.com/services/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';
const hook = 'https://hooks.slack.com/services/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';

const gatewayURL = process.env.GW_URL;
const axios = require('axios');
const queryString = require('query-string');

module.exports = {
  handler,
  handleCommand,
  getApps,
  getStatistics,
  sendStats,
  getSentimentOverTime,
  getLatestReviews,
  getReviews
};

async function handler (event) {
  let body = event.body;
  let responseMessage = '';

  // Generate report or slash command
  if (event.httpMethod == 'POST') {
    try {
      responseMessage = await handleCommand(body);
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error handeling post request: ${error}`
      }
    }
  } else {
    try {
      responseMessage = await report();
    } catch (error) {
      return {
        statusCode: 500,
        error: `Error Generating Report: ${error}`
      }
    }
  }

  console.log("Response message sent to slack")
  console.log(responseMessage);

  return {
    statusCode: 200
  }

}

/**
 *
 * @param body
 * @returns {Promise<string>}
 */
async function handleCommand(body){
  let message = helpMessage(); // Message sent to slack will also be returned
  let parsed = queryString.parse(body); // parse the body of slack post request (URL encoded)
  let parameters = {};  // Create a dictionary / JSON object for any parameters passed with slash command
  let apps = {};
  let stats = {};

  // Extract Parameters from text sent with slash command
  let messagePairs = parsed.text.split(' ');
  for(let i in messagePairs) {
    let pair = messagePairs[i].split('=');
    parameters[pair[0]] = pair[1];
  }

  // Determine if a store was specified for getting apps
  let store = 'both';
  if (parameters.hasOwnProperty('store')) {
    store = parameters.store;
  }

  // Get list of apps we want statistics for
  try {
    apps = await getApps(store);
  } catch (error) {
    console.log(`Error getting apps: ${error}`);
    throw error;
  }

  // Get the statistics for specified apps
  try {
    stats = await getStatistics(apps, parameters);
  } catch (error) {
    console.log(`Error generating statistics for slash command: ${error}`);
    throw error;
  }

  // Call the functions to match the slash commands
  try {
    if (parsed.command == '/getlatestreviews') {
      message = await sendStats(stats);
    } else if (parsed.command == '/getreviews') {

      // Check for required parameters
      if (parameters.hasOwnProperty('startDate') & parameters.hasOwnProperty('endDate') & parameters.hasOwnProperty('version')) {
        message = await sendStats(stats);
      }
    } else if (parsed.command == '/sentimentovertime') {
      message = await getSentimentOverTime(stats);
    } else if (parsed.command == '/sentimenthelp') {
      message = await helpMessage();
    }
  } catch (error) {
    console.log(`Error generating correct message for slash command: ${error}`);
    message = await helpMessage('There was an error handling this slash command');
    throw error;
  }

  return message;

}

/**
 * report sends a scheduled report to slack for all apps available
 * defaulting to the last version, last 7 days and using const webhook
 * @returns slackMessage the scheduled message sent to slack
 */
async function report () {
  let apps = {};
  let statistics = [];
  let slackMessage = '';

  // Get list of apps we want statistics for
  try {
    apps = await getApps();
  } catch (error) {
    console.log(`Error getting apps: ${error}`);
    throw error;
  }

  // Get the statistics for those apps
  try {
    statistics = await getStatistics(apps);
  } catch (error) {
    console.log(`Error getting stats: ${error}`);
    throw error;
  }

  // Send the stats to slack
  try {
    slackMessage = await sendStats(statistics);
  } catch (error) {
    console.log(`Error sending to slack: ${error}`);
    throw error;
  }

  return slackMessage;
}

/**
 * @param store the store (defaults to both unless specified)
 * @returns returns list of apps (filtered by store if specified)
 */
async function getApps(store='both') {
  const endpoint = gatewayURL + '/apps';
  let filteredApps = {};  // apps we want to return depending on store specified
  store = store.toLowerCase();

  const appsRequest = await axios.get(endpoint); // Get list of available apps
  const apps = appsRequest.data;

  // Filter apps based on if a store is specified
  if (store == 'both') {
    return apps;
  } else {

    for (let key in apps) {

      if (store.includes('google')) {
        if (key.includes('Google Play')) {
          filteredApps[key] = apps[key];
        }
      }
      else if (store.includes('apple') | store.contains('ios') | store.contains('app')) {
        if (key.includes('App Store')) {
          filteredApps[key] = apps[key];
        }
      }
    }

  }

  return filteredApps;
}

/**
 * @param applications the list of apps we want statistics from
 * @returns statsList a list of statistics for each specified version of an app
 */
async function getStatistics(apps, parameters={}){
  let promises = [];  // Array for promises
  let statsList = [];

  const endpoint = gatewayURL + '/stats';

  for (let app in apps){
    let appData = apps[app];

    // Using last 7 days
    let days = 7;
    if (parameters.hasOwnProperty('days')) {
      days = parameters.days;
    }

    // Calculate date range using days or defaulting to 7 days back from latest available
    let endDate = new Date();
    let startDate = new Date();

    startDate.setDate(endDate.getDate() - days);
    if (parameters.hasOwnProperty('startDate')) {
      startDate = new Date(parameters.startDate);
      startDate = startDate.toISOString();
    }
    if (parameters.hasOwnProperty('endDate')) {
      endDate = new Date(parameters.endDate);
      endDate = endDate.toISOString();
    }

    // Either use specified version or default to latest version
    let latestVersion = appData.versions[appData.versions.length - 1];
    if (parameters.hasOwnProperty('version')) {
      latestVersion = parameters.version;
    }

    // Parameters to make request to stats endpoint
    let params = {
      'appIdStore': app,
      'version': latestVersion,
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

    // Push promise to array of promises
    promises.push(axios.post(endpoint, params));
  }

  // Await all promises
  let allAppsPromises = Promise.all(promises);
  let allApps = [];

  try {
    allApps = await allAppsPromises;
  } catch (error) {
    throw error;
  }

  let keys = Object.keys(apps);
  for (let i= 0; i < allApps.length; i++) {
    let appName = apps[keys[i]].name;
    allApps[i].data.name = appName;
    statsList.push(allApps[i].data);
  }

  return statsList;
}

/** sendStats is the function called on schedule to send a report scheduled report to slack
 * @param statistics list of statistics to output to slack
 */
async function sendStats(statistics){
  let reports = []; // List of reports to send to slack as messages (One report per app)

  // report represents the index in statistics list
  for (let report in statistics) {
    let message = '';
    let slackAttachments = [
        {"fallback": "Overall Sentiment",
        "color": "#0066ff",
        "title": "Overall Sentiment",
        },
        {"fallback": "Positive Keywords",
        "color": "#36a64f",
        "title": "Keywords in Positive Reviews"
        },
        {"fallback": "Negative Keywords",
        "color": "#ff0000",
        "title": "Keywords in Negative Reviews"
        }];

    let statsList = statistics[report];
    let overallSentiment = statsList.overallSentiment;
    let rawReviews = statsList.rawReviews;
    let keywords = statsList.keywords;
    let version = statsList.version;
    let name = statsList.name;
    let startDate = statsList.sentimentOverTime.labels[0];
    let endDate = statsList.sentimentOverTime.labels[statsList.sentimentOverTime.labels.length-1];

    let sentiment = [Math.round(overallSentiment.POSITIVE), Math.round(overallSentiment.NEGATIVE), Math.round(overallSentiment.MIXED), Math.round(overallSentiment.NEUTRAL)];
    let max = Math.max(sentiment[0], sentiment[1], sentiment[2], sentiment[3]);

    let attitude = '';
    if (max == sentiment[0]) {
      attitude = "Positive";
    } else if (max == sentiment[1]) {
      attitude = "Negative";
    } else if (max == sentiment[2]) {
      attitude = 'Mixed';
    } else {
      attitude = 'Neutral';
    }

    message += `Report for:\nApp: ${name}\nVersion: ${version}\n`;
    message += `Between ${startDate} and ${endDate}, sentiment has been mostly ${attitude} for ${Object.keys(rawReviews).length} reviews`;

    let text = `Positive: ${sentiment[0]}%\nNegative: ${sentiment[1]}%\nNeutral: ${sentiment[2]}%\nMixed: ${sentiment[3]}%`;
    slackAttachments[0].text = text;

    text = '';
    for (let i in keywords.positive) {
      let word = keywords.positive[i];
      text += `${word.keyword}: ${Math.round(word.percentage*100)/100}%\n`
    }
    slackAttachments[1].text = text;

    text = '';
    for (let i in keywords.negative) {
      let word = keywords.negative[i];
      text += `${word.keyword}: ${Math.round(word.percentage*100)/100}%\n`
    }
    slackAttachments[2].text = text;

    let params = {
      text: message,
      attachments: slackAttachments
    }

    reports.push(params);
  }

  for (let report in reports) {
    axios.post(hook, reports[report]);
  }

  return reports;
}

async function getLatestReviews(statistics) {
  let message = "calling getLatestReviews";
  console.log(message);
  return message;

}

async function getReviews(statistics) {
  let message = "calling getReviews";
  console.log(message);
  return message;
}

/**
 * @param statistics list of statistics to output to slack
 */
async function getSentimentOverTime(statistics){
  let message = 'calling getSentimentOverTime';
  console.log(message);
  return message;

  // report represents the index in statistics list
  for (let report in statistics) {
    message += '____________________________\n';
    let statsList = statistics[report];

    let sentimentOverTime = statsList.sentimentOverTime;
    let data = sentimentOverTime.data;
    let labels = sentimentOverTime.labels;
    let rawReviews = statsList.rawReviews;
    let version = statsList.version;
    let name = statsList.name;

    message += `For app Version: ${version}\nApp: ${name}\n\n`;
    message += `Between 10/25/2018 and 11/01/2018, we saw ${Object.keys(rawReviews).length} new reviews\n`;
    message += `\t\tBroken up in to days where reviews were written:\n`;

    for (let i in data) {
      let date =  labels[i];
      let percent = Math.round(data[i]);

      if (data[i] != null) {
        message += `\t\t\t\tOn ${date}, ${percent}% of reviews were positive!\n`;
      }
    }
    message += '\n\n\nEnd Report\n\n\n';
  }


  let params = {
    text: message
  };

  axios.post(hook, params);
  return message;
}

async function helpMessage(text='') {
  let message = '';

  return message;
}