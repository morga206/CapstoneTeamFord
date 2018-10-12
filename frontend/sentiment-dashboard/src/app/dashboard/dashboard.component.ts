import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestService, StatRequest, StatResponse, AppInfo } from '../rest.service';
import {Observable, Subscription, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { DatepickerComponent } from '../shared/datepicker/datepicker.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public pieChartLabels: string[] = ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'];
  public pieChartData: number[] = [20, 40, 40, 5, 5];
  public pieChartType = 'pie';
  public pieChartColors: Array<any> = [
    { backgroundColor: ['rgba(0,229,0,1)', 'rgba(83,204,65,1)', 'rgba(200, 200, 200, 1)', 'rgba(158,0,0,1)', 'rgba(204,65,65,1)'] }
  ];

  public lineChartData: Array<any> = [
    { data: [100, 75, 40, 50, 72, 67, 80], label: 'Positive' },
    { data: [0, 25, 20, 50, 28, 42, 20], label: 'Negative' }
  ];
  public lineChartLabels: Array<any> =
    ['September 1', 'September 2', 'September 3', 'September 4', 'September 5', 'September 6', 'September 7'];
  public lineChartType = 'line';
  public lineChartOptions: any = {
    responsive: true
  };
  public lineChartColors: Array<any> = [
    { // green
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(83,204,65,1)',
      pointBackgroundColor: 'rgba(83,204,65,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(83,204,65,1)'
    },
    { // red
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(204,65,65,1)',
      pointBackgroundColor: 'rgba(204,65,65,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(204,65,65,0.8)'
    }];

  private autoUpdate: Subscription;
  private stat$?: Observable<any>;

  private appsSubscription: Subscription;
  private appList: { [id: string]: AppInfo } = {};
  private selectedApp?: AppInfo;

  private statsFilterForm: FormGroup;
  private appIdStore: AbstractControl;
  private version: AbstractControl;
  private startDate: AbstractControl;
  private endDate: AbstractControl;

  constructor(private rest: RestService, private fb: FormBuilder) { }

  ngOnInit() {
    this.statsFilterForm = this.fb.group({
      'appName': ['', Validators.required],
      'appVersion': ['', Validators.required],
      'startDate': ['', Validators.required],
      'endDate': ['', Validators.required]
    });

    this.appIdStore = this.statsFilterForm.get('appName');
    this.version = this.statsFilterForm.get('appVersion');
    this.startDate = this.statsFilterForm.get('startDate');
    this.endDate = this.statsFilterForm.get('endDate');

    this.appsSubscription = this.rest.getApps().subscribe((apps: { [id: string]: AppInfo }) => {
      this.appList = apps;
    });

    this.autoUpdate = timer(0, 100000).subscribe(() => {
      this.getAppStats();
    });
  }

  ngOnDestroy() {
    this.autoUpdate.unsubscribe();
    this.appsSubscription.unsubscribe();
  }

  private onAppSelect(appIdStore: string) {
    this.selectedApp = this.appList[appIdStore];

    if (this.selectedApp.versions.length > 0) {
      this.version.setValue(this.selectedApp.versions[0]);
    }
  }

  private getAppStats() {
    if (this.statsFilterForm.invalid) {
      return;
    }

    const stats: StatRequest[] = [{
      rawReviews: null
    }];

    this.stat$ = this.rest
          .getSentimentStats(
            this.appIdStore.value,
            this.version.value,
            new Date(this.startDate.value),
            new Date(this.endDate.value),
            stats);
  }
}
