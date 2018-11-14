import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsComponent } from './stats.component';
import { CardComponent } from '../card/card.component';
import { ChartsModule } from 'ng2-charts';
import { Tooltip, ChartData } from './chartjs.types';
import { StatResponse, Keyword } from 'src/app/rest/domain';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsComponent, CardComponent ],
      imports: [ChartsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the stat cards when new data is available', () => {
    const expectedPieChartLabels = ['positive', 'negative', 'mixed', 'neutral'];
    const expectedPieChartData = [10.2, 50, 13, 27.8];

    const expectedPositiveKeywords: Keyword[] = [
      {
        keyword: 'positiveTest1',
        percentage: 12
      },
      {
        keyword: 'positiveTest2',
        percentage: 13
      },
      {
        keyword: 'positiveTest3',
        percentage: 14
      },
      {
        keyword: 'positiveTest4',
        percentage: 15
      }
    ];
    const expectedNegativeKeywords: Keyword[] = [
      {
        keyword: 'negativeTest1',
        percentage: 13
      },
      {
        keyword: 'negativeTest2',
        percentage: 14
      },
      {
        keyword: 'negativeTest3',
        percentage: 15
      },
      {
        keyword: 'negativeTest4',
        percentage: 16
      }
    ];

    const expectedLineChartLabels: string[] = ['May 1', 'May 2'];
    const expectedLineChartData: number[] = [50, 20];
    const expectedReviewTotals: number[] = [23, 42];

    const statResponse: StatResponse = {
      numReviews: { total: 13 },
      overallSentiment: {
        'positive': 10.2,
        'negative': 50,
        'mixed': 13,
        'neutral': 27.8
       },
      keywords: {
        positive: expectedPositiveKeywords,
        negative: expectedNegativeKeywords
      },
      sentimentOverTime: {
        labels: expectedLineChartLabels,
        data: expectedLineChartData,
        totals: expectedReviewTotals
      }
    };

    component.setStats(statResponse);

    expect(component.pieChartData).toEqual(expectedPieChartData);
    expect(component.pieChartLabels).toEqual(expectedPieChartLabels);

    expect(component.positiveKeywords).toEqual(expectedPositiveKeywords);
    expect(component.negativeKeywords).toEqual(expectedNegativeKeywords);

    expect(component.lineChartData[0].data).toEqual(expectedLineChartData);
    expect(component.lineChartLabels).toEqual(expectedLineChartLabels);
    expect(component.reviewTotals).toEqual(expectedReviewTotals);
  });

  it('should correctly format chart tooltips', () => {
    const tooltipItem: Tooltip = {
      index: 0,
      datasetIndex: 0
    };
    const chartData: ChartData = {
      datasets: [{
        data: [1],
        labels: ['test label']
      }]
    };

    let tooltip = component.getPercentTooltip()(tooltipItem, chartData);
    let expected = '1%';

    expect(tooltip).toEqual(expected);

    component.reviewTotals = [24];
    tooltip = component.getPercentWithTotalTooltip()(tooltipItem, chartData);
    expected = '1% of 24 reviews';

    expect(tooltip).toEqual(expected);
  });
});
