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

  private currentlyComparing = false;

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
  }

  ngOnDestroy() {
    this.autoUpdate.unsubscribe();
    this.appsSubscription.unsubscribe();
    this.statsSubscription.unsubscribe();
  }

  private updateStatsSubscription(event: StatsFilterValues) {
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

  public setCurrentlyComparing(event: boolean) {
    this.currentlyComparing = event;
  }
}
