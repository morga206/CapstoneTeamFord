# Ford Customer App Review Dashboard
## CSE Capstone, Michigan State University, Fall 2018
http://capstone.cse.msu.edu/2018-08/projects/ford/

# Deployment Instructions
Ford Customer App Review Dashboard Deployment

## Backend

From the repository root...

1. Install the Serverless Framework using NPM, then set up your AWS credentials for deployment. See Serverless Documentation: https://serverless.com/framework/docs/providers/aws/guide/quick-start/

2. Enter the backend project folder: `cd backend`

3. Enter the Main module folder: `cd main`

4. Build the Main module using [Maven](https://maven.apache.org/download.cgi): `mvn install`

5. Enter the backend project folder: `cd ..`

6. Deploy the project using the Serverless Framework: `sls deploy -s <stage name>`.

7. Perform additional Cognito configuration:

    1. Only users in the "admin" group may access the Dashboard Administration page. To create the admin group:

        - Navigate to **Cognito > Manage User Pools > sentiment-dashboard-`<your stage>`-user-pool > Users and Groups**.

        - Select the **Groups** tab and click **“Create Group”**. Title the group “admin".

    2. To add users to the group:

        - Navigate to **Cognito > Manage User Pools > sentiment-dashboard-`<your stage>`-user-pool > Users and Groups**.

        - Select the **Users** tab and click on a username. Click **“Add to Group”** and select “admin”.

## Frontend

From the repository root...

1. Install the Angular CLI Utilities: `npm install -g @angular/cli`

2. Enter the frontend project folder: `cd frontend/sentiment-dashboard`

3. Install all project dependencies using `npm install`.

4. Set the necessary Angular environment variables. 

    1. Edit the correct file:

        - Production builds (`ng build --prod`): `src/environments/environments.prod.ts` 

        - Development builds (`ng serve`): `src/environments/environments.ts`

    2. In the appropriate file, set the following values for your deployment environment:

        - Region: The AWS region configured in serverless.yml.

        - userPoolId: The User Pool ID for your Cognito pool, accessible in the AWS Console at **Cognito > Manage User Pools > sentiment-dashboard-`<your stage>`-user-pool > General Settings**.

        5. userPoolWebClientId: The App Client ID for your Cognito pool, accessible in the AWS Console at **Cognito > Manage User Pools > sentiment-dashboard-`<your stage>`-user-pool > App clients**.

        6. backendUrl: The endpoint for your backend stage, including a trailing slash. This can be looked up by executing `sls info -s <stage name>` in the `backend` folder.

5. Build the Angular project with `ng build --prod`.

6. Change to the backend project folder: `cd ../../backend`.

7. Use the Serverless Framework to deploy the frontend to AWS S3: `sls client deploy -s <stage name>`.

    - Note: AWS S3 is suitable for demonstration purposes, but may not include the necessary features for more permanent deployment (HTTPS, etc.).

## Slack bot

1. Visit [https://api.slack.com/apps/new](https://api.slack.com/apps/new) to create a new Slack app, selecting an App name and workspace as appropriate.

2. Select **Bot Users** on the left side of the screen and click **“Add a Bot user”**. Follow the prompts to create a new bot user.

3. Select **Slash commands** on the left side of the screen and configure the following commands for your app:

    1. **Command:** /getlatestreviews  
    **Request URL:** Your `/slack/command` endpoint from `sls info -s <stage name>`  
    **Description:** Get the latest reviews and their sentiment over the past 7 days for both app stores (by default)  
    **Usage Hint:** (days=7) (store=both)

    2. **Command:** /getreviews  
    **Request URL:** Your /slack/command endpoint from `sls info -s <stage name>`  
    **Description:** Get the latest reviews and their sentiment over the past 7 days for both app stores (by default)
    **Usage Hint:** (days=7) (store=both)

    3. **Command:** /getsentimentovertime  
    **Request URL:** Your /slack/command endpoint from `sls info -s <stage name>`  
    **Description:** Gets the sentiment over time for apps and displays sentiment by day [required parameters] (optional parameters)  
    **Usage Hint:** [startDate=] [endDate=] (version=) (store=)

    4. **Command:** /sentimenthelp  
    **Request URL:** Your /slack/command endpoint from `sls info -s <stage name>`  
    **Description:** Get a list of commands and how to use them!

4. Select **Install App** from the left side of the screen and install the app to your workspace.

5. Configure your app’s bot token in AWS:
    1.  Select **OAuth and Permissions** from the left side of the screen and make a note of your app’s Bot User OAuth Access Token. 

    3. In the AWS Console, create a new SSM Parameter for the token:

        - Visit **Systems Manager > Parameter Store > Create Parameter** to create new parameters with the following information:  
            - **Name:** slackBotToken  
            - **Type:** SecureString  
            - **Value:** Bot token from step 5-1. 


# API Reference
Sentiment Analysis Dashboard API Reference

## Introduction

The endpoints are created at deployment with an API gateway URL with the following tailing endpoints. Modules within the Sentiment Analysis Dashboard utilize these endpoints to produce Slack output and move data within the backend.

## Endpoints

### /stats

#### Allowed Methods: 
POST

#### Request:
Request format should include in the body, a JSON object containing the following fields:

- appIdStore - Unique Id for each app, store combination

- version - Version number (string) for app we want statistics for

- startDate, endDate - Time range for when reviews were written in ISO format, `yyyy-mm-ddT00:00:00.000z`

- stats - List of statistics (formatted as below) desired

Ex.
```
{
   appIdStore: ‘com.ford.fordpass*Google Play’’,
   version: ‘2.4.1’,
   startDate: ‘2018-11-11T00:00:00.000z’,
   endDate: ‘2018-11-15T00:00:00.000z’,
   stats: [{
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
}
```

#### Response:
The body of the response contains a JSON object with the statistics requested for the given time interval with the following fields:

- status - Status of the request

- message - Error message if status is ERROR, else undefined

If included in request, the following fields will also be included:

- overallSentiment - JSON object with the sentiment ratings

- sentimentOverTime - JSON field containing three (equally sized) lists, data contains the actual percentages of negative reviews, totals contains total reviews for that day, and labels are string values for the date.

- keywords - JSON field containing entries for negative and positive, whose values are lists containing each keyword as a JSON object.
rawReviews - JSON field containing raw review data as a string, where the keys are a review’s hash

- numReviews - JSON field containing the total number of reviews for the time range specified

Ex:
```
{
    status: “SUCCESS”,
    overallSentiment: {
        POSITIVE: 25.00,
        MIXED: 25.00,
        NEUTRAL: 25.00,
        NEGATIVE: 25.00
    },
    sentimentOverTime: {
        data: [33.33, 50,  38.46],
        totals: [3, 24, 13],
        labels: [“Nov 11”, “Nov 12”, “Nov 13”]
    },
    keywords: {
        positive: [{keyword: “pos word”, percentage: 8.33}],
        negative: [{keyword: “neg word”, percentage: 14.24}]
    },
    rawReviews: {
        “157ef234jsdf9g”: “”,
        “532sdsfe9t78df”: “”
    },
    numReviews: {
        total: 60
    },
    version: “2.4.1”,
    appIdStore: “com.ford.fordpass*Google Play”
}
```

### /apps

#### Allowed Methods:
GET

#### Response:
The body of the response contains a JSON object with the apps requested. The fields in the JSON object are:

- status - Status of the request

- message - Error message if status is ERROR, else undefined

- apps - Nested JSON object containing app data, where keys are the appStoreId’s.

- name - App Name

- slackReport - Whether or not the app is included in scheduled reports

- minDate, maxDate - Time range where reviews have been written about the app

- versions - List of version numbers for that app

Ex. 
```
{
    status: “SUCCESS”,
    apps: {
        com.ford.fordpass*Google Play: {
            name: "FordPass (Google Play)",
            SlackReport: true,
            minDate: "2018-10-03",
            maxDate: "2018-12-01",
            versions: [
                "2.5.0"
            ]
        }
    }
}
```

### /settings/get

#### Allowed Methods:
POST

#### Request:
This endpoint gets the list of settings for this stage. The requests are formatted with the following field:

- names - A list of setting names to get the values for

Ex.
```
{
    names: ["settingName1", “settingName2”]
}
```

#### Response:
The response includes:

- status - Status of the request

- message - Error message if status is ERROR, else undefined

- settings - A list of settings with the setting name and value

Ex.
```
{
    status: “SUCCESS”,
    settings: [{name: “settingName”, value: “settingValue”} ]
}
```

### /settings/set

#### Allowed Methods:
POST

#### Request:
This endpoint sets a setting with the body of an request containing:

- settings - List of Settings with setting names and setting values as a JSON object.

Ex.
```
{
    settings: [{name: "settingName", value: “settingValue”}]
}
```

#### Response:
The response includes:

- status - Status of the request

- message - Error message if status is ERROR, else undefined

Ex.
```
{
    status: “SUCCESS”
}
```

### /reviews

This endpoint runs the scraper on any type of http request made to it and fills the current stage with any new reviews. This endpoint was made primarily for development purposes since the scraper is run on an interval through Lambda.

### /slackbot/report

This endpoint responds to http GET requests by sending a report to Slack - this essentially acts as a manual trigger for a scheduled Slack report and is primarily used for development purposes. 

### /slackbot/command

  - The Slack Slash Commands Documentation that provides information on how this endpoint interacts with slack. https://api.slack.com/slash-commands

  - This endpoint is responsible for handling the slash commands sent from slack. This is done in the following steps:

    - When the request is first received, a dispatcher Lambda is invoked. This Lambda immediately responds with 200 to avoid timeout on Slack’s end, then calls a second worker Lambda.

    - The worker handles the command and generates a report based on the /command itself and any passed parameters.

    - The worker then replies to a responseURL  that corresponds to the channel the command originated from, and slack outputs the  report.

	


