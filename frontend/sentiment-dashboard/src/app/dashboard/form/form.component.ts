import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, AbstractControl, Validators, FormBuilder } from '@angular/forms';
import { AppInfo } from 'src/app/rest/domain';
import {IMyDrpOptions} from 'mydaterangepicker';


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

  public appList: { [id: string]: AppInfo } = {};
  public selectedApp?: AppInfo;

  public statsFilterForm: FormGroup;
  public appIdStore: AbstractControl;
  public version: AbstractControl;
  public dateRange: AbstractControl;

  public startDate?: Date;
  public endDate?: Date;
  public myDateRangePickerOptions: IMyDrpOptions = {
    dateFormat: 'mm/dd/yyyy'
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.statsFilterForm = this.fb.group({
      'appName': ['', Validators.required],
      'appVersion': ['', Validators.required],
      'dateRange': ['']
    });


    this.appIdStore = this.statsFilterForm.get('appName');
    this.version = this.statsFilterForm.get('appVersion');
    this.dateRange = this.statsFilterForm.get('dateRange');
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

  public onDateChange(event: { [key: string]: Date }) {
    this.startDate = event.beginJsDate;
    this.endDate = event.endJsDate;
    this.onFilterChange();
  }

  public getCurrentValues(): StatsFilterValues | undefined {
    if (this.statsFilterForm.invalid) {
      return undefined;
    }


    const values: StatsFilterValues = {
      appIdStore: this.appIdStore.value,
      version: this.version.value,
      startDate: this.startDate,
      endDate: this.endDate
    };

    return values;
  }

  clearDateRange(): void {
    // Clear the date range using the patchValue function
    this.statsFilterForm.patchValue({dateRange: ''});
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
