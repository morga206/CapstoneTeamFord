'use strict';
const hook = 'https://hooks.slack.com/services/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';

const gatewayURL = process.env.GW_URL;

const axios = require('axios');

module.exports = {
  handler,
  getApps,
  getStatistics,
  sendStats
};

async function handler () {
  let apps = {};
  let statistics = [];

  // Get list of apps we want statistics for
  try {
    apps = await getApps();
  } catch (error) {
    return {
      statusCode: 500, // Internal Server Error
      error: `Error getting ford apps: ${error}`
    };
  }

  // Get the statistics for those apps
  try {
    statistics = await getStatistics(apps);
  } catch (error) {
    return {
      statusCode: 500,
      error: `Error getting ford stats: ${error}`
    };
  }

  try {
    await sendStats(statistics);
  } catch (error) {
    return {
      statusCode: 500,
      error: `Error sending to slack: ${error}`
    };
  }

  return {
    statusCode: 200, // OK
    body: JSON.stringify({
      response: statistics
    })
  };
}

/**
 *
 * @param gatewayURL the gateway url for aws lambda endpoint
 * @returns returns list of ford apps
 */
async function getApps() {
  const endpoint = gatewayURL + '/apps';
  return axios.get(endpoint);

}

/**
 *
 * @param fordApps the list of apps we want statistics from
 * @returns appStats a list of statistics for each specified version of an app
 */
async function getStatistics(applications){
  let promises = [];  // Array for promises
  let statsList = [];

  const apps = applications.data;
  const endpoint = gatewayURL + '/stats';

  for (let app in apps){
    let appData = apps[app];

    // Using last 7 days
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Use the latest version currently
    let latestVersion = appData.versions[appData.versions.length - 1];

    // Parameters to make request to stats endpoint
    let params = {
      'appIdStore': app,
      'version': latestVersion,
      'startDate': startDate,
      'endDate': endDate,
      'stats': [{
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

  for (let i= 0; i < allApps.length; i++) {
    statsList.push(allApps[i].data);
  }

  return statsList;
}

/**
 * @param statistics list of statistics to output to slack
 */
async function sendStats(statistics){
  let message = '';

  for (let report in statistics) {
    let statsList = statistics[report].stats;

    for (let stat in statsList) {
      message += statsList[stat].rawReviews;
      message += '\n';
    }

    message += '\n\n';
  }

  let params = {
    text: message
  };

  axios.post(hook, params);
}