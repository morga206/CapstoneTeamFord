
const hook = "https://hooks.slack.com/services/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"

const aws = require('aws-sdk');
const region = process.env.DEPLOY_REGION;
const table = process.env.TABLE_NAME;

async function handler() {

    // Get apps from spring apps endpoint
    let fordApps = getFordApps();

    // Get the statistics for each app
    let statistics = getFordStatistics(fordApps);

    // Send statistics to a webhook
    sendStats(statistics);


    return {
        statusCode: 200, // OK
        body: JSON.stringify({
            length: processedReviews.length,
            reviews: processedReviews
        })
    };
}

/**
 *
 * @returns {Promise<void>}
 */
async function getFordApps(){

}

/**
 *
 * @param fordApps the list of apps we want statistics from
 * @returns {Promise<void>}
 */
async function getFordStatistics(fordApps){

}

/**
 *
 */
async function sendStats(statistics){

}