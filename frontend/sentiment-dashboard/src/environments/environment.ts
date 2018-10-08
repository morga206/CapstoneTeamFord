// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  amplify: {
    Auth: {
      identityPoolId: 'us-east-2:4957308e-33bf-4f0b-bb4d-c4b474ab5f60',
      region: 'us-east-2',
      userPoolId: 'us-east-2_lwDxbALVG',
      userPoolWebClientId: '7c7kf36q1u5dqigi41evkiota4'
    }
  }
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
