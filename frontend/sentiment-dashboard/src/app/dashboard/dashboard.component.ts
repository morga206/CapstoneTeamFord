import { Component, OnInit } from '@angular/core';
import { RestService, StatRequest, StatResponse } from '../rest.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public pieChartLabels: string[] = ['Download Sales', 'In-Store Sales', 'Mail Sales'];
  public pieChartData: number[] = [300, 500, 100];
  public pieChartType = 'pie';

  public lineChartData: Array<any> = [
    [65, 59, 80, 81, 56, 55, 40],
    [28, 48, 40, 19, 86, 27, 90]
  ];
  public lineChartLabels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChartType = 'line';
  public lineChartOptions: any = {
    responsive: true
  };

  public stat$?: Observable<any>;

  constructor(public rest: RestService) { }

  ngOnInit() {
    const stats: StatRequest[] = [{
      rawReviews: null
    }];
    this.stat$ = this.rest
      .getSentimentStats('com.ford.fordpass*Google Play', '2.4.0', new Date('2018-05-21'), new Date('2018-05-23'), stats);
  }

}
