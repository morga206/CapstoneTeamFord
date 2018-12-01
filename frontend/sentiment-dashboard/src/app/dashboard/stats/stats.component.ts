import { Component, OnInit, ViewChild } from '@angular/core';
import { StatResponse, Keyword } from 'src/app/rest/domain';
import { BaseChartDirective } from 'ng2-charts';
import { Tooltip, ChartData } from './chartjs.types';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  public totalReviews: number;

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
        label: this.getPercentTooltip()
      }
    }
  };

  public lineChartData: Array<any> = [];
  public reviewTotals: Array<number> = [];
  public lineChartLabels: Array<any> = [];
  public lineChartType = 'line';
  public lineChartOptions: any = {
    responsive: true,
    spanGaps: false,
    tooltips: {
      callbacks: {
        label: this.getPercentWithTotalTooltip()
      }
    }
  };
  public lineChartColors: Array<any> = [
    {
      backgroundColor: 'rgba(204,65,65,0.5)',
      borderColor: 'rgba(204,65,65,1)',
      pointBackgroundColor: 'rgba(204,65,65,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(204,65,65,1)'
    }];

    public positiveKeywords: Keyword[] = [];
    public negativeKeywords: Keyword[] = [];

  constructor() { }

  ngOnInit() {
  }

  public setStats(stats: StatResponse) {
    this.totalReviews = stats['numReviews']['total'];

    // Cannot change reference to labels array or chart won't update
    this.pieChartLabels.length = 0;
    this.pieChartLabels.push(...Object.keys(stats['overallSentiment']));
    this.pieChartData = Object.values(stats['overallSentiment']);

    this.positiveKeywords = stats['keywords']['positive'];
    this.negativeKeywords = stats['keywords']['negative'];

    // Cannot change reference to labels array or chart won't update
    this.reviewTotals = stats['sentimentOverTime']['totals'];
    this.lineChartLabels.length = 0;
    this.lineChartLabels.push(...stats['sentimentOverTime']['labels']);
    this.lineChartData = [
      { data: stats['sentimentOverTime']['data'], label: '% Negative Reviews'},
    ];
  }

  public getPercentTooltip() {
    return (tooltipItem: Tooltip, data: ChartData) => {
      const allData = data.datasets[tooltipItem.datasetIndex].data;
      const tooltipData = allData[tooltipItem.index];
      return Math.round(tooltipData) + '%';
    };
  }

  public getPercentWithTotalTooltip() {
    return (tooltipItem: Tooltip, data: ChartData) => {
      const allData = data.datasets[tooltipItem.datasetIndex].data;
      const tooltipData = allData[tooltipItem.index];

      const suffix = this.reviewTotals[tooltipItem.index] === 1 ? ' review' : ' reviews';
      return Math.round(tooltipData) + '%' + ' of ' + this.reviewTotals[tooltipItem.index] + suffix;
    };
  }

  public pieChartIsEmpty() {
    // If no data are present, or all data are 0, then chart is empty
    return this.pieChartData.length === 0
      || this.pieChartData.filter((element) => element !== 0).length === 0;
  }

  public lineChartIsEmpty() {
    // If no data are present, or all data are null, then chart is empty
    return this.lineChartData.length === 0
      || this.lineChartData[0].data.filter((element) => element !== null).length === 0;
  }
}
