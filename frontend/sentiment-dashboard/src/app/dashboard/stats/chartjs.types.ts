// ng2-charts doesn't define types for Chart.js, so we've partially done so here
export interface ChartData {
  datasets: Array<DataSet>;
}

export interface DataSet {
  data: Array<number>;
  labels: Array<string>;
}

export interface Tooltip {
  index: number;
  datasetIndex: number;
}
