import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RestService, StatRequest, StatResponse, AppInfo } from '../rest.service';
import {Observable, Subscription, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { DatepickerComponent } from '../shared/datepicker/datepicker.component';
import { FormComponent, StatsFilterValues } from './form/form.component';
import { StatsComponent } from './stats/stats.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild('form1') form: FormComponent;
  @ViewChild('form2') formCompare: FormComponent;

  @ViewChild('stats1') stats: StatsComponent;
  @ViewChild('stats2') statsCompare: StatsComponent;
  public currentlyComparing = false;

  private autoUpdate: Subscription;
  private appsSubscription: Subscription;
  private statsSubscription?: Subscription;

  constructor(private rest: RestService, private fb: FormBuilder) { }

  ngOnInit() {
    this.appsSubscription = this.rest.getApps().subscribe((apps: { [id: string]: AppInfo }) => {
      this.form.setAppList(apps);
      this.formCompare.setAppList(apps);
    });

    this.autoUpdate = timer(0, 100000).subscribe(() => {
      const values: StatsFilterValues | undefined = this.form.getCurrentValues();

      if (values !== undefined) {
        this.updateStatsSubscription(values);
      }
    });

    this.autoUpdate = timer(0, 100000).subscribe(() => {
      if (this.formCompare === undefined || this.statsCompare === undefined){
        return;
      }
      const values: StatsFilterValues | undefined = this.formCompare.getCurrentValues();

      if (values !== undefined) {
        this.updateCompareStatsSubscription(values);
      }
    });
  }

  ngOnDestroy() {

    if (this.autoUpdate !== undefined) {
      this.autoUpdate.unsubscribe();
    }

    if (this.appsSubscription !== undefined) {
      this.appsSubscription.unsubscribe();
    }

    if (this.statsSubscription !== undefined) {
      this.statsSubscription.unsubscribe();
    }
  }

  public updateStatsSubscription(event: StatsFilterValues) {
    const statsToGet: StatRequest[] = [{
      rawReviews: null
    }];

    this.statsSubscription = this.rest.getSentimentStats(
            event.appIdStore,
            event.version,
            event.startDate,
            event.endDate,
            statsToGet).subscribe((response) => {
              this.stats.setStats(response);
            });
  }

  public updateCompareStatsSubscription(event: StatsFilterValues) {
    const statsToGet: StatRequest[] = [{
      rawReviews: null
    }];

    this.statsSubscription = this.rest.getSentimentStats(
      event.appIdStore,
      event.version,
      event.startDate,
      event.endDate,
      statsToGet).subscribe((response) => {
      this.statsCompare.setStats(response);
    });

  }

  public setCurrentlyComparing(event: boolean) {
    this.currentlyComparing = event;
  }
}
