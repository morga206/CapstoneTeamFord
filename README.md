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

4. Build the Main module using Maven: `mvn install`

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

    2. In the AWS Console, create a new SSM Parameter for the token:

        - In the Console, visit **Systems Manager > Parameter Store > Create Parameter** to create a new parameter with the following information:  
          - **Name:** slackBotToken  
          - **Type:** SecureString  
          - **Value:** Bot token from step 6a.


# API Reference

