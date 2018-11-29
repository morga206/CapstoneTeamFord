import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { StatRequest, FilterListResponse } from '../rest/domain';
import { Subscription, timer } from 'rxjs';
import { FormComponent, StatsFilterValues } from './form/form.component';
import { StatsComponent } from './stats/stats.component';
import { RestService } from '../rest/rest.service';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild('form1') form: FormComponent;
  @ViewChild('form1Loader') formLoader: LoaderComponent;
  @ViewChild('form2') formCompare: FormComponent;
  @ViewChild('form2Loader') formCompareLoader: LoaderComponent;

  @ViewChild('stats1') stats: StatsComponent;
  @ViewChild('stats1Loader') statsLoader: LoaderComponent;
  @ViewChild('stats2') statsCompare: StatsComponent;
  @ViewChild('stats2Loader') statsCompareLoader: LoaderComponent;
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

    this.formLoader.startLoading();
    if (this.currentlyComparing) {
      this.formCompareLoader.startLoading();
    }
    this.appsSubscription = this.rest.getFilterList().subscribe((response: FilterListResponse) => {
      this.form.setAppList(response.apps);
      this.formCompare.setAppList(response.apps);

      this.formLoader.stopLoading();
      if (this.currentlyComparing) {
        this.formCompareLoader.stopLoading();
      }
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

      if (!this.currentlyComparing) {
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

    this.statsLoader.startLoading();
    this.statsSubscription = this.rest.getSentimentStats(
            event.appIdStore,
            event.version,
            event.startDate,
            event.endDate,
            statsToGet).subscribe((response) => {
              this.stats.setStats(response);
              this.statsLoader.stopLoading();
            });
  }

  public updateCompareStatsSubscription(event: StatsFilterValues) {
    const statsToGet: StatRequest[] = [
      { numReviews: null },
      { overallSentiment: null },
      { keywords: null },
      { sentimentOverTime: null }
    ];

    this.statsCompareLoader.startLoading();
    this.statsSubscription = this.rest.getSentimentStats(
      event.appIdStore,
      event.version,
      event.startDate,
      event.endDate,
      statsToGet).subscribe((response) => {
      if (this.statsCompare !== undefined) {
        this.statsCompare.setStats(response);
        this.statsCompareLoader.stopLoading();
      }
    });
  }

  public setCurrentlyComparing(event: boolean) {
    this.currentlyComparing = event;
  }
}
