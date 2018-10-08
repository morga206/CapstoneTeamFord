## Capstone Team README notes

This is a modified version of facundoolano's app-store-scraper npm module. It has been altered to use Apple's XML-formatted app review RSS feed, which returns an additional "Date" field. Additionally, unnecessary functions have been removed; this version of the README has been updated to remove descriptions of these functions. To view the original module, please visit [the original module's github repository](https://github.com/facundoolano/app-store-scraper).

# app-store-scraper [![Build Status](https://secure.travis-ci.org/facundoolano/app-store-scraper.png)](http://travis-ci.org/facundoolano/app-store-scraper)
Node.js module to scrape application data from the iTunes/Mac App Store.
The goal is to provide an interface as close as possible to the
[google-play-scraper](https://github.com/facundoolano/google-play-scraper) module.

## Usage
Available methods:
- [app](#app): Retrieves the full detail of an application.
- [reviews](#reviews): Retrieves a page of reviews for the app.

### app
Retrieves the full detail of an application. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.
* `country`: the two letter country code to get the app details from. Defaults to `us`. Note this also affects the language of the data.

Example:

```javascript
var store = require('app-store-scraper');

store.app({id: 553834731}).then(console.log).catch(console.log);
```

Results:

```javascript
{ id: 553834731,
  appId: 'com.midasplayer.apps.candycrushsaga',
  title: 'Candy Crush Saga',
  url: 'https://itunes.apple.com/us/app/candy-crush-saga/id553834731?mt=8&uo=4',
  description: 'Candy Crush Saga, from the makers of Candy Crush ...',
  icon: 'http://is5.mzstatic.com/image/thumb/Purple30/v4/7a/e4/a9/7ae4a9a9-ff68-cbe4-eed6-fe0a246e625d/source/512x512bb.jpg',
  genres: [ 'Games', 'Entertainment', 'Puzzle', 'Arcade' ],
  genreIds: [ '6014', '6016', '7012', '7003' ],
  primaryGenre: 'Games',
  primaryGenreId: 6014,
  contentRating: '4+',
  languages: [ 'EN', 'JA' ],
  size: '73974859',
  requiredOsVersion: '5.1.1',
  released: '2012-11-14T14:41:32Z',
  updated: '2016-05-31T06:39:52Z',
  releaseNotes: 'We are back with a tasty Candy Crush Saga update ...',
  version: '1.76.1',
  price: 0,
  currency: 'USD',
  free: true,
  developerId: 526656015,
  developer: 'King',
  developerUrl: 'https://itunes.apple.com/us/developer/king/id526656015?uo=4',
  developerWebsite: undefined,
  score: 4,
  reviews: 818816,
  currentVersionScore: 4.5,
  currentVersionReviews: 1323,
  screenshots:
   [ 'http://a3.mzstatic.com/us/r30/Purple49/v4/7a/8a/a0/7a8aa0ec-976d-801f-0bd9-7b753fdaf93c/screen1136x1136.jpeg',
     ... ],
  ipadScreenshots:
   [ 'http://a1.mzstatic.com/us/r30/Purple49/v4/db/45/cf/db45cff9-bdb6-0832-157f-ac3f14565aef/screen480x480.jpeg',
     ... ],
  appletvScreenshots: [],
  supportedDevices:
   [ 'iPhone-3GS',
     'iPadWifi',
     ... ] }
```


### reviews

Retrieves a page of reviews for the app. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.
* `country`: the two letter country code to get the reviews from. Defaults to `us`.
* `page`: the review page number to retrieve. Defaults to `0`, maximum allowed is `9`.
* `sort`: the review sort order. Defaults to `store.sort.RECENT`, available options are `store.sort.RECENT` and `store.sort.HELPFUL`.

Example:

```js
var store = require('app-store-scraper');

store.reviews({
  appId: 'com.midasplayer.apps.candycrushsaga',
  sort: store.sort.HELPFUL,
  page: 2
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
[ { id: '1472864600',
    userName: 'Linda D. Lopez',
    userUrl: 'https://itunes.apple.com/us/reviews/id324568166',
    version: '1.80.1',
    score: 5,
    title: 'Great way to pass time or unwind',
    text: 'I was a fan of Bejeweled many moons ago...',
    url: 'https://itunes.apple.com/us/review?id=553834731&type=Purple%20Software' },,
  { id: '1472864708',
    userName: 'Jennamaxkidd',
    userUrl: 'https://itunes.apple.com/us/reviews/id223990784',
    version: '1.80.1',
    score: 1,
    title: 'Help! THE PROBLEM IS NOT FIXED!',
    text: 'STILL HAVING THE SAME ISSUE.  It\'s happening again...',
    url: 'https://itunes.apple.com/us/review?id=553834731&type=Purple%20Software' },
  (...)
]
```

### Memoization

Since every library call performs one or multiple requests to
an iTunes API or web page, sometimes it can be useful to cache the results
to avoid requesting the same data twice. The `memoized` function returns the
store object that caches its results:

``` javascript
var store = require('app-store-scraper'); // regular non caching version
var memoized = require('app-store-scraper').memoized(); // cache with default options
var memoizedCustom = require('app-store-scraper').memoized({ maxAge: 1000 * 60 }); // cache with default options

memoized.app({id: 553834731}) // will make a request
  .then(() => memoized.app({id: 553834731})); // will resolve to the cached value without requesting
```

The options available are those supported by the [memoizee](https://github.com/medikoo/memoizee) module.
By default up to 1000 values are cached by each method and they expire after 5 minutes.
