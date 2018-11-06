import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, AbstractControl, Validators, FormBuilder } from '@angular/forms';
import { AppInfo } from 'src/app/rest/domain';


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
  public minDate?: Date;
  public maxDate?: Date;

  public statsFilterForm: FormGroup;
  public appIdStore: AbstractControl;
  public version: AbstractControl;

  public startDate?: Date;
  public endDate?: Date;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.statsFilterForm = this.fb.group({
      'appName': ['', Validators.required],
      'appVersion': ['', Validators.required]
    });


    this.appIdStore = this.statsFilterForm.get('appName');
    this.version = this.statsFilterForm.get('appVersion');
  }


  public onAppSelect(appIdStore: string) {
    this.selectedApp = this.appList[appIdStore];
    this.minDate = new Date(this.selectedApp.minDate);
    this.maxDate = new Date(this.selectedApp.maxDate);

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

  public onDateChange(event: Date[]) {
    if (event === null) {
      this.startDate = undefined;
      this.endDate = undefined;
    } else {
      this.startDate = event[0];
      this.endDate = event[1];
    }

    this.onFilterChange();
  }

  public getCurrentValues(): StatsFilterValues | undefined {
    if (this.statsFilterForm.invalid
      || this.startDate === undefined
      || this.endDate === undefined) {
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

  public toggleComparison() {
    this.currentlyComparing = !this.currentlyComparing;
    this.compareText = this.currentlyComparing ? 'Stop Comparing' : 'Compare Apps';
    this.compare.emit(this.currentlyComparing);
  }
  public setAppList(apps: { [id: string]: AppInfo }) {
    this.appList = apps;
  }
}
