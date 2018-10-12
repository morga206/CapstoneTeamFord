import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, AbstractControl, Validators, FormBuilder } from '@angular/forms';
import { AppInfo } from 'src/app/rest.service';

export interface StatsFilterValues {
  appIdStore: string;
  version: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  @Input() showCompare = true;

  @Output() compare = new EventEmitter<boolean>();
  public compareText = 'Compare Apps';
  private currentlyComparing = false;

  @Output() filterChange = new EventEmitter<StatsFilterValues>();

  private appList: { [id: string]: AppInfo } = {};
  private selectedApp?: AppInfo;

  private statsFilterForm: FormGroup;
  private appIdStore: AbstractControl;
  private version: AbstractControl;
  private startDate: AbstractControl;
  private endDate: AbstractControl;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.statsFilterForm = this.fb.group({
      'appName': ['', Validators.required],
      'appVersion': ['', Validators.required],
      'startDate': ['', Validators.required],
      'endDate': ['', Validators.required]
    });

    this.appIdStore = this.statsFilterForm.get('appName');
    this.version = this.statsFilterForm.get('appVersion');
    this.startDate = this.statsFilterForm.get('startDate');
    this.endDate = this.statsFilterForm.get('endDate');
  }

  public onAppSelect(appIdStore: string) {
    this.selectedApp = this.appList[appIdStore];

    if (this.selectedApp.versions.length > 0) {
      this.version.setValue(this.selectedApp.versions[0]);
    }
  }

  public onFilterChange() {
    const values: StatsFilterValues | undefined = this.getCurrentValues();

    if (values !== undefined) {
      this.filterChange.emit(values);
    }
  }

  public getCurrentValues(): StatsFilterValues | undefined {
    if (this.statsFilterForm.invalid) {
      return undefined;
    }

    const values: StatsFilterValues = {
      appIdStore: this.appIdStore.value,
      version: this.version.value,
      startDate: new Date(this.startDate.value),
      endDate: new Date(this.endDate.value)
    };

    return values;
  }

  public toggleComparison() {
    this.currentlyComparing = !this.currentlyComparing;
    this.compareText = this.currentlyComparing ? 'Stop Comparing' : 'Compare Apps';
    this.compare.emit(this.currentlyComparing);
  }

  public setAppList(apps: { [id: string]: AppInfo }) {
    this.appList = apps;
  }

}
