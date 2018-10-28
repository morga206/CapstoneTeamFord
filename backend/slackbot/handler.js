'use strict';
const hook = "https://hooks.slack.com/services/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"

const region = process.env.DEPLOY_REGION;
const stage = process.env.STAGE;
const gatewayURL = process.env.GW_URL;

const axios = require('axios');

module.exports = {
    handler,
    getFordApps,
    getFordStatistics,
    sendStats
}

async function handler () {
    let fordApps = {};
    let statistics = [];

    // Get list of apps we want statistics for
    try {
        fordApps = await getFordApps();
    } catch (error) {
        return {
            statusCode: 500, // Internal Server Error
            error: `Error getting ford apps: ${error}`
        };
    }

    // Get the statistics for those apps
    try {
        statistics = await getFordStatistics(fordApps);
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
            apps: statistics
        })
    };
}

/**
 *
 * @param gatewayURL the gateway url for aws lambda endpoint
 * @returns returns list of ford apps
 */
async function getFordApps() {
    let endpoint = gatewayURL + '/apps';
    return axios.get(endpoint);

}

/**
 *
 * @param fordApps the list of apps we want statistics from
 * @returns appStats a list of statistics for each specified version of an app
 */
async function getFordStatistics(fordApps){
    let promises = [];  // Array for promises
    let appStats = [];  // Array for App Statistics for each version of each app we want

    let apps = fordApps.data;
    let endpoint = gatewayURL + '/stats';

    for (let i in apps){
        let app = apps[i];

        // Parsing out dates right now, needs to be changed and cleaned
        let endDate = app.maxDate + "T00:00:00.000Z";
        let dates = endDate.split('-');
        let day = parseInt(dates[2]);
        let month = dates[1];
        let startDay = day - 7;
        if (day < 7) {
            startDay = 31 - day;
            if (month == '01') {
                month = '12';
            }
        }
        let startDate = dates[0] + '-' + month + '-' + startDay + 'T00:00:00.000Z';

        // Currently sorting the list of app versions assuming latest
        let sortedVersions = app.versions;
        sortedVersions.sort();
        let latestVersion = sortedVersions[sortedVersions.length-1];

        // Parameters to make request to stats endpoint
        let params = {
            "appIdStore": i,
            "version": latestVersion,
            "startDate": startDate,
            "endDate": endDate,
            "stats": [{
                "rawReviews": null
            }]
        };

        // Push promise to array of promises
        promises.push(axios.post(endpoint, params));
        // Create the dictionary for this specific version of either app
        appStats.push({
            "appIdStore": i,
            "version": latestVersion,
            "statistics": []
        })
    }

    // Await all promises
    let allAppsPromises = Promise.all(promises);
    let allApps = [];

    try {
        allApps = await allAppsPromises;
    } catch (error) {
        throw error;
    }

    // Add statistics to the list of apps
    let appStatistics = [].concat(allApps);
    for (let i = 0; i < appStatistics.length; i++) {
        appStats[i].statistics = appStatistics[i].data.stats;
    }

    return appStats;
}

/**
 *
 */
async function sendStats(statistics){

    /**
     * params = {
     *     text: "text that will output to slack"
     * }
     * axios.post(hook, params);
     */
    let message = ''
    let params = {
        text: "Hello World"
    }

    axios.post(hook, params);


}