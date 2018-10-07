import { Component, OnInit, OnDestroy} from '@angular/core';
import { RestService, StatRequest, StatResponse } from '../rest.service';
import {Observable, Subscription, timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

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

  public autoUpdate: Subscription;
  public stat$?: Observable<any>;
  private tick: string;
  private subscripition: Subscription;



  constructor(public rest: RestService) { }

  ngOnInit() {
    const stats: StatRequest[] = [{
      rawReviews: null
    }];
    this.autoUpdate = timer(0, 100000).subscribe(() => {
      this.stat$ = this.rest
          .getSentimentStats(
            'com.ford.fordpass*Google Play',
            '2.4.0',
            new Date('2018-05-21'),
            new Date('2018-05-23'),
            stats);
    });
  }

  ngOnDestroy(){
    this.autoUpdate.unsubscribe();
  }

}
