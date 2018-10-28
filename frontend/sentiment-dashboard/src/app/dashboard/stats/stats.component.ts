import { Component, OnInit, ViewChild } from '@angular/core';
import { StatResponse, Keyword } from 'src/app/rest/domain';
import { BaseChartDirective } from 'ng2-charts';
import { ToolTip, ChartData } from './chartjs.types';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {

  public pieChartLabels: string[] = [];
  public pieChartData: number[] = [];
  public pieChartType = 'pie';
  public pieChartColors: Array<any> = [
    { backgroundColor: ['rgba(0,229,0,1)', 'rgba(244,220,66,1)', 'rgba(204,65,65,1)', 'rgba(200, 200, 200, 1)'] }
  ];
  public pieChartOptions: any = {
    responsive: true,
    tooltips: {
      callbacks: {
        label: this.getPercentTooltip
      }
    }
  };

  public lineChartData: Array<any> = [];
  public lineChartLabels: Array<any> = [];
  public lineChartType = 'line';
  public lineChartOptions: any = {
    responsive: true,
    spanGaps: false,
    tooltips: {
      callbacks: {
        label: this.getPercentTooltip
      }
    }
  };
  public lineChartColors: Array<any> = [
    { // green
      backgroundColor: 'rgba(83,204,65,0.5)',
      borderColor: 'rgba(83,204,65,1)',
      pointBackgroundColor: 'rgba(83,204,65,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(83,204,65,1)'
    }];

    public positiveKeywords: Keyword[] = [];
    public negativeKeywords: Keyword[] = [];

  constructor() { }

  ngOnInit() {
  }

  public setStats(stats: StatResponse) {
    // Cannot change reference to labels array or chart won't update
    this.pieChartLabels.length = 0;
    this.pieChartLabels.push(...Object.keys(stats['overallSentiment']));
    this.pieChartData = Object.values(stats['overallSentiment']);

    this.positiveKeywords = stats['keywords']['positive'];
    this.negativeKeywords = stats['keywords']['negative'];

    // Cannot change reference to labels array or chart won't update
    console.log(stats['sentimentOverTime']);
    this.lineChartLabels.length = 0;
    this.lineChartLabels.push(...stats['sentimentOverTime']['labels']);
    this.lineChartData = [
      { data: stats['sentimentOverTime']['data'], label: '% Positive Reviews'},
    ];
  }

  public getPercentTooltip(toolTipItem: ToolTip, data: ChartData) {
    const allData = data.datasets[toolTipItem.datasetIndex].data;
    const toolTipData = allData[toolTipItem.index];
    return Math.round(toolTipData) + '%';
  }

}
