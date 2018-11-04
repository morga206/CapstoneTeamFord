import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { CardComponent } from './card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { FormComponent } from './form/form.component';
import { StatsComponent } from './stats/stats.component';
import { AuthService } from '../auth/auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { StatResponse, Keyword, AppInfo } from '../rest/domain';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let httpMock: HttpTestingController;

  const API_URL = environment.backendUrl;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardComponent, CardComponent, FormComponent, StatsComponent ],
      providers: [AuthService],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        ChartsModule,
        HttpClientModule,
        HttpClientTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.get(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('successfully queries for updated stats', () => {
    // Send mock app list to initialize component
    const testApp: AppInfo = {
      minDate: new Date('01-01-2018').toISOString(),
      maxDate: new Date('12-31-2018').toISOString(),
      versions: ['1.0.0', '2.0.0', '3.0.0']
    };

    const testAppList: { [id: string]: AppInfo } = {
      'testApp': testApp
    };
    const appsReq = httpMock.expectOne(API_URL + 'apps');
    appsReq.flush(testAppList);

    // Check for properly formatted stat request when updateStats functions are called
    const statResponse: StatResponse = {
      overallSentiment: {
        'positive': 10.2,
        'negative': 50,
        'mixed': 13,
        'neutral': 27.8
       },
      keywords: {
        positive: [],
        negative: []
      },
      sentimentOverTime: {
        labels: ['May 1', 'May 2'],
        data: [50, 20],
        totals: [23, 42]
      }
    };

    const testAppIdStore = 'testAppIdStore';
    const testVersion = '1.0.0';
    const testStartDate = new Date('01-01-2018');
    const testEndDate = new Date('01-02-2018');

    const expectedStatsRequest = {
      'appIdStore': testAppIdStore,
      'version': testVersion,
      'startDate': testStartDate.toISOString(),
      'endDate': testEndDate.toISOString(),
      'stats': [
        { overallSentiment: null },
        { keywords: null },
        { sentimentOverTime: null }
      ]
    };

    component.updateStatsSubscription({
      appIdStore: testAppIdStore,
      version: testVersion,
      startDate: testStartDate,
      endDate: testEndDate
    });

    const statsReq = httpMock.expectOne(API_URL + 'stats');
    expect(statsReq.request.body).toEqual(JSON.stringify(expectedStatsRequest));
    statsReq.flush(statResponse);

    component.updateCompareStatsSubscription({
      appIdStore: testAppIdStore,
      version: testVersion,
      startDate: testStartDate,
      endDate: testEndDate
    });

    const compareStatsReq = httpMock.expectOne(API_URL + 'stats');
    expect(compareStatsReq.request.body).toEqual(JSON.stringify(expectedStatsRequest));
    compareStatsReq.flush(statResponse);

    httpMock.verify();
  });
});
