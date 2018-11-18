import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { StatRequest, FilterListResponse } from '../rest/domain';
import { Subscription, timer } from 'rxjs';
import { FormComponent, StatsFilterValues } from './form/form.component';
import { StatsComponent } from './stats/stats.component';
import { RestService } from '../rest/rest.service';

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

  public errorMessage = '';

  private autoUpdateSettingSubscription: Subscription;
  private autoUpdateSubscription: Subscription;
  private appsSubscription: Subscription;
  private statsSubscription?: Subscription;

  constructor(private rest: RestService) { }

  ngOnInit() {
    this.autoUpdateSettingSubscription = this.rest.getSettings(['refreshInterval'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.errorMessage = response.message;
      } else {
        this.startAutoUpdate(response.settings[0].value);
      }
    });

    this.appsSubscription = this.rest.getFilterList().subscribe((response: FilterListResponse) => {
      this.form.setAppList(response.apps);
      this.formCompare.setAppList(response.apps);
    });
  }

  ngOnDestroy() {

    if (this.autoUpdateSettingSubscription !== undefined) {
      this.autoUpdateSettingSubscription.unsubscribe();
    }

    if (this.autoUpdateSubscription !== undefined) {
      this.autoUpdateSubscription.unsubscribe();
    }

    if (this.appsSubscription !== undefined) {
      this.appsSubscription.unsubscribe();
    }

    if (this.statsSubscription !== undefined) {
      this.statsSubscription.unsubscribe();
    }
  }

  public startAutoUpdate(interval: string) {
    // Interval is in minutes - convert to milliseconds
    const timerInterval = parseInt(interval, 10) * 60000;

    this.autoUpdateSubscription = timer(0, timerInterval).subscribe(() => {
      const values: StatsFilterValues | undefined = this.form.getCurrentValues();

      if (values !== undefined) {
        this.updateStatsSubscription(values);
      }

      if (this.formCompare === undefined || this.statsCompare === undefined) {
        return;
      }

      const compareValues: StatsFilterValues | undefined = this.formCompare.getCurrentValues();

      if (compareValues !== undefined) {
        this.updateCompareStatsSubscription(compareValues);
      }
    });
  }

  public updateStatsSubscription(event: StatsFilterValues) {
    const statsToGet: StatRequest[] = [
      { numReviews: null },
      { overallSentiment: null },
      { keywords: null },
      { sentimentOverTime: null }
    ];

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
    const statsToGet: StatRequest[] = [
      { numReviews: null },
      { overallSentiment: null },
      { keywords: null },
      { sentimentOverTime: null }
    ];

    this.statsSubscription = this.rest.getSentimentStats(
      event.appIdStore,
      event.version,
      event.startDate,
      event.endDate,
      statsToGet).subscribe((response) => {
      if (this.statsCompare !== undefined) {
        this.statsCompare.setStats(response);
      }
    });
  }

  public setCurrentlyComparing(event: boolean) {
    this.currentlyComparing = event;
  }
}
