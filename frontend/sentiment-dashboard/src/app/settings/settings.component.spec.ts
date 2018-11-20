import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { SettingResponse, App, AppListResponse, IgnoreListResponse } from '../rest/domain';
import { AuthService } from '../auth/auth.service';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { ComponentLoaderFactory } from 'ngx-bootstrap';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { of } from 'rxjs';
import { LoaderComponent } from '../shared/loader/loader.component';

class MockAuthService {
  getIdToken() {
    return of('12345');
  }
}

describe('SettingsComponent', () => {
  const API_URL = environment.backendUrl;

  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let httpMock: HttpTestingController;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsComponent, LoaderComponent ],
      imports: [ ReactiveFormsModule, HttpClientModule, HttpClientTestingModule, ModalModule ],
      providers: [ { provide: AuthService, useClass: MockAuthService }, BsModalService, ComponentLoaderFactory, PositioningService ]
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
    const testRefreshInterval = '30';

    const testDashboardResponse: SettingResponse = {
      settings: [
        {
          name: 'refreshInterval',
          value: testRefreshInterval
        }
      ],
      message: null,
      status: 'SUCCESS'
    };

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

    const testAppList: App[] = [{ name: 'test', store: 'Google Play', appId: 'com.ford.test', slackReport: true }];
    const testAppListResponse: AppListResponse = {
      appList: testAppList,
      status: 'SUCCESS',
      message: null
    };

    const testIgnoreList: string[] = ['test', 'keyword', 'list'];
    const testIgnoreListResponse: IgnoreListResponse = {
      ignoreList: testIgnoreList,
      status: 'SUCCESS',
      message: null
    };

    const reqs = httpMock.match(API_URL + 'settings/get');
    reqs.forEach((req) => {
      if (req.request.body === JSON.stringify({names: ['refreshInterval']})) {
        req.flush(testDashboardResponse);
      } else if (req.request.body === JSON.stringify({names: ['pollingInterval']})) {
        req.flush(testScrapingResponse);
      } else {
        req.flush(testSlackResponse);
      }
    });

    const appListReq = httpMock.expectOne(API_URL + 'settings/apps');
    appListReq.flush(testAppListResponse);

    const ignoreListReq = httpMock.expectOne(API_URL + 'settings/keywords');
    ignoreListReq.flush(testIgnoreListResponse);

    httpMock.verify();

    expect(component.refreshInterval.value).toEqual(testRefreshInterval);

    expect(component.pollingInterval.value).toEqual(testPollingInterval);

    expect(component.postingChannel.value).toEqual(testPostingChannel);
    expect(component.postingInterval.value).toEqual(testPostingInterval);

    expect(component.appList).toEqual(testAppList);
    expect(component.ignoreList).toEqual(testIgnoreList);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be valid when all fields are filled out', () => {
    component.refreshInterval.setValue('25');
    component.dashboardForm.updateValueAndValidity();
    expect(component.dashboardForm.valid).toBeTruthy();

    component.pollingInterval.setValue('30');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.postingChannel.setValue('general');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();
  });

  it('should not be valid when fields are blank', () => {
    component.refreshInterval.setValue('25');
    component.dashboardForm.updateValueAndValidity();
    expect(component.dashboardForm.valid).toBeTruthy();

    component.refreshInterval.setValue('');
    expect(component.dashboardForm.valid).toBeFalsy();

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
    component.refreshInterval.setValue('abc');
    component.dashboardForm.updateValueAndValidity();
    expect(component.dashboardForm.valid).toBeFalsy();

    component.refreshInterval.setValue('30');
    component.dashboardForm.updateValueAndValidity();
    expect(component.dashboardForm.valid).toBeTruthy();

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
    spyOn(component.dashboardLoader, 'showErrorAlert');
    spyOn(component.scrapingLoader, 'showErrorAlert');
    spyOn(component.slackLoader, 'showErrorAlert');
    spyOn(component.appListLoader, 'showErrorAlert');
    spyOn(component.ignoreListLoader, 'showErrorAlert');

    const testResponse: SettingResponse = {
      settings: null,
      message: 'Test Error Message',
      status: 'ERROR'
    };

    const reqs = httpMock.match(API_URL + 'settings/get');
    reqs.forEach((req) => req.flush(testResponse));

    const appListReq = httpMock.expectOne(API_URL + 'settings/apps');
    appListReq.flush(testResponse);

    const ignoreListReq = httpMock.expectOne(API_URL + 'settings/keywords');
    ignoreListReq.flush(testResponse);

    httpMock.verify();

    expect(component.dashboardLoader.showErrorAlert).toHaveBeenCalledWith('Test Error Message');
    expect(component.scrapingLoader.showErrorAlert).toHaveBeenCalledWith('Test Error Message');
    expect(component.slackLoader.showErrorAlert).toHaveBeenCalledWith('Test Error Message');
    expect(component.appListLoader.showErrorAlert).toHaveBeenCalledWith('Test Error Message');
    expect(component.ignoreListLoader.showErrorAlert).toHaveBeenCalledWith('Test Error Message');
  });

  it('should display a success message on save for a time interval', async() => {
    spyOn(component.dashboardLoader, 'showSuccessAlert');
    spyOn(component.scrapingLoader, 'showSuccessAlert');
    spyOn(component.slackLoader, 'showSuccessAlert');
    spyOn(component.appListLoader, 'showSuccessAlert');
    spyOn(component.ignoreListLoader, 'showSuccessAlert');

    initializeSettings();

    component.refreshInterval.setValue('25');
    component.scrapingForm.updateValueAndValidity();
    expect(component.scrapingForm.valid).toBeTruthy();

    component.postingChannel.setValue('general');
    component.postingInterval.setValue('45');
    component.slackForm.updateValueAndValidity();
    expect(component.slackForm.valid).toBeTruthy();

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
          appId: 'com.ford.test',
          slackReport: true
        }
      ]
    };

    const testIgnoreListSuccessResponse: IgnoreListResponse = {
      message: null,
      status: 'SUCCESS',
      ignoreList: ['test', 'keyword', 'list']
    };

    component.onDashboardSubmit();
    let req = httpMock.expectOne(API_URL + 'settings/set');
    req.flush(testSuccessResponse);
    expect(component.dashboardLoader.showSuccessAlert).toHaveBeenCalled();

    component.onScrapingSubmit();
    req = httpMock.expectOne(API_URL + 'settings/set');
    req.flush(testSuccessResponse);
    expect(component.scrapingLoader.showSuccessAlert).toHaveBeenCalled();

    component.onSlackSubmit();
    req = httpMock.expectOne(API_URL + 'settings/set');
    req.flush(testSuccessResponse);
    expect(component.slackLoader.showSuccessAlert).toHaveBeenCalled();

    component.onAddApp({ name: 'test', store: 'App Store', appId: 'com.ford.test', slackReport: true});
    req = httpMock.expectOne(API_URL + 'settings/apps');
    req.flush(testAppListSuccessResponse);

    const toDelete = component.appList[0];
    component.onDeleteApp(toDelete);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    req.flush(testAppListSuccessResponse);
    expect(component.appListLoader.showSuccessAlert).toHaveBeenCalledTimes(2);

    component.addKeyword.setValue('anotherKeyword');
    component.addKeyword.updateValueAndValidity();
    component.onAddKeyword();
    req = httpMock.expectOne(API_URL + 'settings/keywords');
    req.flush(testIgnoreListSuccessResponse);

    const toDeleteKeyword = component.ignoreList[0];
    component.onDeleteKeyword(toDeleteKeyword);
    req = httpMock.expectOne(API_URL + 'settings/keywords');
    req.flush(testIgnoreListSuccessResponse);
    expect(component.ignoreListLoader.showSuccessAlert).toHaveBeenCalledTimes(2);

    httpMock.verify();
  });

  it('should display data from the REST service', () => {
    initializeSettings();
  });

  it('should update setting values on save', async () => {
    initializeSettings();

    const updatedRefreshInterval = '15';
    component.refreshInterval.setValue(updatedRefreshInterval);
    component.dashboardForm.updateValueAndValidity();
    expect(component.dashboardForm.valid).toBeTruthy();

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

    component.onDashboardSubmit();
    let req = httpMock.expectOne(API_URL + 'settings/set');

    const expectedDashboardRequest = {
      settings: [
        {
          name: 'refreshInterval',
          value: updatedRefreshInterval
        }
      ]
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedDashboardRequest));


    component.onScrapingSubmit();
    req = httpMock.expectOne(API_URL + 'settings/set');


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

    const toAdd: App = { name: 'test', store: 'App Store', appId: 'com.ford.test', slackReport: true };
    component.onAddApp(toAdd);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    const expectedAppListAddRequest = {
      command: 'ADD',
      app: toAdd
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedAppListAddRequest));

    component.onSlackCheckbox(toAdd, { target: { checked: false }});
    const toUpdate: App = { name: 'test', store: 'App Store', appId: 'com.ford.test', slackReport: false };
    req = httpMock.expectOne(API_URL + 'settings/apps');
    const expectedAppListUpdateRequest = {
      command: 'UPDATE',
      app: toUpdate
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedAppListUpdateRequest));

    const toDelete: App = component.appList[0];
    component.onDeleteApp(toDelete);
    req = httpMock.expectOne(API_URL + 'settings/apps');
    const expectedAppListDeleteRequest = {
      command: 'DELETE',
      app: toDelete
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedAppListDeleteRequest));

    const toAddKeyword = 'add';
    component.addKeyword.setValue(toAddKeyword);
    component.addKeyword.updateValueAndValidity();
    component.onAddKeyword();
    req = httpMock.expectOne(API_URL + 'settings/keywords');
    const expectedIgnoreListAddRequest = {
      command: 'ADD',
      keyword: toAddKeyword
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedIgnoreListAddRequest));

    const toDeleteKeyword: string = component.ignoreList[0];
    component.onDeleteKeyword(toDeleteKeyword);
    req = httpMock.expectOne(API_URL + 'settings/keywords');
    const expectedIgnoreListDeleteRequest = {
      command: 'DELETE',
      keyword: toDeleteKeyword
    };
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(JSON.stringify(expectedIgnoreListDeleteRequest));

    httpMock.verify();
  });
});
