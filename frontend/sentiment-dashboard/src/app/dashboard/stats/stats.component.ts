import { Component, OnInit } from '@angular/core';
import { StatResponse } from 'src/app/rest/domain';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {

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

  public stats?: StatResponse[];

  constructor() { }

  ngOnInit() {
  }

  public setStats(stats: StatResponse[]) {
    this.stats = stats;
  }

}
