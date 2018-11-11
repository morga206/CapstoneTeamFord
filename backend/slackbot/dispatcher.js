'use strict';
const aws = require('aws-sdk');
const worker = process.env.WORKER_LAMBDA;
const region = process.env.DEPLOY_REGION;
const queryString = require('query-string');

module.exports = {
  handler,
};

/**
 * Handler function that directs responses to scheduled Slack reports and slash commands
 * @param event The event or request
 * @param callback The Lambda-Proxy callback function 
 */
function handler (event, _, callback) {
  let response;
  if (event.hasOwnProperty('detail-type')) {
    // This is a scheduled CloudWatch event
    try {
      invokeWorker('report');
    } catch (error) {
      response = {
        'statusCode': 500,
        'headers': {},
        'body': JSON.stringify({ error: `Error handling scheduled report: ${error}` }),
        'isBase64Encoded': false
      };
    }
  } else if (event.hasOwnProperty('httpMethod')) {
    // This is a HTTP request
    let command;
    try {
      command = handleHttpRequest(event);
    } catch (error) {
      response = {
        'statusCode': 500,
        'headers': {},
        'body': JSON.stringify({ error: `Error handling httpRequest: ${error}` }),
        'isBase64Encoded': false
      };
    }

    response = {
      'statusCode': 200,
      'headers': {},
      'body': command ? JSON.stringify({ response_type: 'in_channel'}) : JSON.stringify({}),
      'isBase64Encoded': false
    };
  } else {
    response = {
      'statusCode': 500,
      'headers': {},
      'body': JSON.stringify({ error: 'Error, Unrecognized event type' }),
      'isBase64Encoded': false
    };
  }

  callback(null, response);
}

/**
 * Function takes in an httpEvent and determines if it is a report request or slash command request
 * @param httpEvent The http JSON formatted event
 * @return True if this is a slash command, false otherwise
 */
function handleHttpRequest(httpEvent) {
  if (httpEvent.path.endsWith('command')) {
    const requestBody = queryString.parse(httpEvent.body);
    invokeWorker('command', requestBody);
    return true;
  } else if (httpEvent.path.endsWith('report')) {
    invokeWorker('report');
    return false;
  }
}

/**
 * Invoke the worker lambda
 * @param type The type of request (report or command)
 * @param request The relevant request body content, if any
 */
function invokeWorker(type, request) {
  let lambda = new aws.Lambda({ region: region });
  let params = {
    FunctionName : worker,
    InvocationType: 'Event', // asynchronous
    Payload: JSON.stringify({ type: type, request: request })
  };

  lambda.invoke(params, function (error) {
    if (error !== null) {
      console.log(`Error invoking worker lambda: ${error}`);
      throw error;
    }
  });
}