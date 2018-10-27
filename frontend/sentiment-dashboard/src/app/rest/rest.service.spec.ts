import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RestService } from './rest.service';
import { HttpClient } from 'selenium-webdriver/http';
import { HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { StatResponse } from './domain';

describe('RestService', () => {
  const API_URL = environment.backendUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RestService],
      imports: [HttpClientModule, HttpClientTestingModule]
    });
  });

  it('should be created', inject([RestService], (service: RestService) => {
    expect(service).toBeTruthy();
  }));

  it('should successfully query the backend for the filter app list',
    inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
    const testResponse = {
      'com.ford.fordpass*Google Play': {
        name: 'FordPass (Google Play)',
        minDate: '2018-06-28',
        maxDate: '2018-10-14',
        versions: [
            '2.4.1'
        ]
      }
    };

    service.getFilterApps().subscribe((response) => {
      expect(response).toEqual(testResponse);
    });
    const req = httpMock.expectOne(API_URL + 'apps');
    expect(req.request.method).toEqual('GET');
    req.flush(testResponse);

    httpMock.verify();
  }));

  it('should successfully query the backend for stats',
    inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
      const appIdStore = 'com.ford.fordpass*Google Play';
      const version = '2.0.0';
      const startDate = new Date('10-01-2018');
      const endDate = new Date('10-31-2018');
      const stats = [
        { 'rawReviews': [] }
      ];
      const testResponse: StatResponse = { 'rawReviews': [] };

      const expectedBody = JSON.stringify({
        appIdStore: appIdStore,
        version: version,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        stats: stats
      });

      service.getSentimentStats(appIdStore, version, startDate, endDate, stats)
        .subscribe((response) => {
        expect(response).toEqual(testResponse);
      });
      const req = httpMock.expectOne(API_URL + 'stats');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(expectedBody);
      req.flush(testResponse);

      httpMock.verify();
    }));

  it('should successfully query the backend for settings',
    inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
      const names = ['testSetting'];

      const testResponse = {
        'settings': [{
          'name': 'testSetting',
          'value': ''
        }],
        'status': 'SUCCESS',
        'message': null
      };

      const expectedBody = JSON.stringify({
        names: names
      });

      service.getSettings(names)
        .subscribe((response) => {
        expect(response).toEqual(testResponse);
      });
      const req = httpMock.expectOne(API_URL + 'settings/get');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(expectedBody);
      req.flush(testResponse);

      httpMock.verify();
  }));

  it('should successfully request to set a setting',
    inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
      const settings = [{
        name: 'testSetting',
        value: 'testValue'
      }];

      const testResponse = {
        'settings': null,
        'message': null,
        'status': 'SUCCESS'
      };

      const expectedBody = JSON.stringify({
        settings: settings
      });

      service.setSettings(settings)
        .subscribe((response) => {
        expect(response).toEqual(testResponse);
      });
      const req = httpMock.expectOne(API_URL + 'settings/set');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(expectedBody);
      req.flush(testResponse);

      httpMock.verify();
  }));

  it('should successfully query for the app list',
    inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
      const testResponse = {
        'appList': [{
          'name': 'test',
          'store': 'App Store',
          'appId': 'com.ford.test'
          }],
        'message': null,
        'status': 'SUCCESS'
      };

      const expectedBody = JSON.stringify({
        command: 'GET'
      });

      service.getAppList()
        .subscribe((response) => {
        expect(response).toEqual(testResponse);
      });
      const req = httpMock.expectOne(API_URL + 'settings/apps');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(expectedBody);
      req.flush(testResponse);

      httpMock.verify();
  }));

  it('should successfully add to the app list',
  inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
    const app = {
      name: 'test',
      store: 'App Store',
      appId: 'com.ford.test'
    };

    const testResponse = {
      'appList': [{
            'name': 'test',
            'store': 'App Store',
            'appId': 'com.ford.test'
      }],
      'message': null,
      'status': 'SUCCESS'
    };

    const expectedBody = JSON.stringify({
      command: 'ADD',
      app: app
    });

    service.addApp(app)
      .subscribe((response) => {
      expect(response).toEqual(testResponse);
    });
    const req = httpMock.expectOne(API_URL + 'settings/apps');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush(testResponse);

    httpMock.verify();
  }));

  it('should successfully delete from the app list',
  inject([HttpTestingController, RestService], async (httpMock: HttpTestingController, service: RestService) => {
    const app = {
      name: 'test',
      store: 'App Store',
      appId: 'com.ford.test'
    };

    const testResponse = {
      'appList': [],
      'message': null,
      'status': 'SUCCESS'
    };

    const expectedBody = JSON.stringify({
      command: 'DELETE',
      app: app
    });

    service.deleteApp(app)
      .subscribe((response) => {
      expect(response).toEqual(testResponse);
    });
    const req = httpMock.expectOne(API_URL + 'settings/apps');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush(testResponse);

    httpMock.verify();
  }));
});
