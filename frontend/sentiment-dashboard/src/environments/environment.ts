// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  amplify: {
    Auth: {
      identityPoolId: '',
      region: 'us-east-2',
      userPoolId: 'us-east-2_R99catdY3',
      userPoolWebClientId: '4fcrkjsm80luke700taf5263l3'
    }
  },
  backendUrl: 'https://rmafxge20k.execute-api.us-east-2.amazonaws.com/noah/'
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
