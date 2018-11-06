import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { SettingResponse, App, AppListResponse } from '../rest/domain';
import { AuthService } from '../auth/auth.service';

describe('SettingsComponent', () => {
  const API_URL = environment.backendUrl;

  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let httpMock: HttpTestingController;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsComponent ],
      imports: [ ReactiveFormsModule, HttpClientModule, HttpClientTestingModule ],
      providers: [AuthService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.get(HttpTestingController);
  });

  // Send inital setting values from the mock backend to populate the form
  function initializeSettings() {
    const testPollingInterval = '30';

    const testScrapingResponse: SettingResponse = {
      settings: [
        {
          name: 'pollingInterval',
          value: testPollingInterval
        }
      ],
      message: null,
      status: 'SUCCESS'
    };

    const testPostingChannel = 'general';
    const testPostingInterval = '45';

    const testSlackResponse: SettingResponse = {
      settings: [
        {
          name: 'postingChannel',
          value: testPostingChannel
        },
        {
          name: 'postingInterval',
          value: testPostingInterval
        }
      ],
      message: null,
      status: 'SUCCESS'
    };

    const testAppList: App[] = [{ name: 'test', store: 'Google Play', appId: 'com.ford.test' }];
    const testAppListResponse: AppListResponse = {
      appList: testAppList,
      status: 'SUCCESS',
      message: null
    };

    const reqs = httpMock.match(API_URL + 'settings/get');
    reqs.forEach((req) => {
      if (req.request.body === JSON.stringify({names: ['pollingInterval']})) {
        req.flush(testScrapingResponse);
      } else {
        req.flush(testSlackResponse);
      }
    });

    const appListReq = httpMock.expectOne(API_URL + 'settings/apps');
    appListReq.flush(testAppListResponse);

    httpMock.verify();

    expect(component.pollingInterval.value).toEqual(testPollingInterval);

    expect(component.postingChannel.value).toEqual(testPostingChannel);
    expect(component.postingInterval.value).toEqual(testPostingInterval);

    expect(component.appList).toEqual(testAppList);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be valid when all fields are filled out', () => {
    component.pollingInterval.setValue('30');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.postingChannel.setValue('general');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();
  });

  it('should not be valid when fields are blank', () => {
    component.pollingInterval.setValue('30');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.pollingInterval.setValue('');
    expect(component.scrapingForm.valid).toBeFalsy();

    component.postingChannel.setValue('general');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeFalsy();

    component.postingChannel.setValue('');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeFalsy();

    component.postingChannel.setValue('general');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();
  });

  it('should not be valid if fields are malformed', () => {
    component.pollingInterval.setValue('abc');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeFalsy();

    component.pollingInterval.setValue('30');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.postingChannel.setValue('general*');
    component.postingInterval.setValue('45bc');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeFalsy();

    component.postingChannel.setValue('general');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeFalsy();

    component.postingChannel.setValue('general*');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeFalsy();

    component.postingChannel.setValue('general');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();
  });

  it('should display any error messages from the backend', async () => {
    const testResponse: SettingResponse = {
      settings: null,
      message: 'Test Error Message',
      status: 'ERROR'
    };

    const reqs = httpMock.match(API_URL + 'settings/get');
    reqs.forEach((req) => req.flush(testResponse));

    const appListReq = httpMock.expectOne(API_URL + 'settings/apps');
    appListReq.flush(testResponse);

    httpMock.verify();

    expect(component.scrapingFormError).toEqual('Test Error Message');
    expect(component.slackFormError).toEqual('Test Error Message');
    expect(component.appListError).toEqual('Test Error Message');
  });

  it('should display a success message on save for a time interval', async() => {
    initializeSettings();

    component.pollingInterval.setValue('30');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.postingChannel.setValue('general');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();

    const testSuccessResponse: SettingResponse = {
      settings: [{ name: 'someSetting', value: 'notUsedInThisTest'}],
      message: null,
      status: 'SUCCESS'
    };

    const testAppListSuccessResponse: AppListResponse = {
      message: null,
      status: 'SUCCESS',
      appList: [
        {
          name: 'test',
          store: 'App Store',
          appId: 'com.ford.test'
        }
      ]
    };

    component.onScrapingSubmit();
    let req = httpMock.expectOne(API_URL + 'settings/set');
    req.flush(testSuccessResponse);
    expect(component.scrapingFormSuccess).toBeTruthy();

    component.onSlackSubmit();
    req = httpMock.expectOne(API_URL + 'settings/set');
    req.flush(testSuccessResponse);
    expect(component.slackFormSuccess).toBeTruthy();

    component.onAddApp({ name: 'test', store: 'App Store', appId: 'com.ford.test'});
    req = httpMock.expectOne(API_URL + 'settings/apps');
    req.flush(testAppListSuccessResponse);
    expect(component.appListSuccess).toBeTruthy();

    const toDelete = component.appList[0];
    component.onDeleteApp(toDelete);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    req.flush(testAppListSuccessResponse);
    expect(component.appListSuccess).toBeTruthy();

    httpMock.verify();
  });

  it('should display data from the REST service', () => {
    initializeSettings();
  });

  it('should update setting values on save', async () => {
    initializeSettings();

    const updatedPollingInterval = '25';
    component.pollingInterval.setValue(updatedPollingInterval);
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    const updatedPostingChannel = 'random';
    const updatedPostingInterval = '40';
    component.postingChannel.setValue(updatedPostingChannel);
    component.postingInterval.setValue(updatedPostingInterval);
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();

    component.onScrapingSubmit();
    let req = httpMock.expectOne(API_URL + 'settings/set');


    const expectedScrapingRequest = {
      settings: [
        {
          name: 'pollingInterval',
          value: updatedPollingInterval
        }
      ]
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedScrapingRequest));


    component.onSlackSubmit();
    req = httpMock.expectOne(API_URL + 'settings/set');
    const expectedSlackRequest = {
      settings: [
        {
          name: 'postingChannel',
          value: updatedPostingChannel
        },
        {
          name: 'postingInterval',
          value: updatedPostingInterval
        }
      ]
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedSlackRequest));

    const toAdd: App = { name: 'test', store: 'App Store', appId: 'com.ford.test'};
    component.onAddApp(toAdd);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    const expectedAppListAddRequest = {
      command: 'ADD',
      app: toAdd
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedAppListAddRequest));

    const toDelete: App = component.appList[0];
    component.onDeleteApp(toDelete);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    const expectedAppListDeleteRequest = {
      command: 'DELETE',
      app: toDelete
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedAppListDeleteRequest));

    httpMock.verify();
  });
});
