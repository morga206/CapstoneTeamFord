import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComponent, StatsFilterValues } from './form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AppInfo } from 'src/app/rest/domain';
import { BsDatepickerModule, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { ComponentLoaderFactory } from 'ngx-bootstrap/loader';
import { PositioningService } from 'ngx-bootstrap/positioning';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  const testApp: AppInfo = {
    minDate: new Date('01-01-2018').toISOString(),
    maxDate: new Date('12-31-2018').toISOString(),
    versions: ['1.0.0', '2.0.0', '3.0.0']
  };

  const testAppList: { [id: string]: AppInfo } = {
    'testApp': testApp
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormComponent ],
      imports: [ ReactiveFormsModule, BsDatepickerModule ],
      providers: [ BsDaterangepickerConfig, ComponentLoaderFactory, PositioningService, BsLocaleService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the version list when an app is selected', () => {
    component.setAppList(testAppList);
    component.onAppSelect('testApp');
    expect(component.selectedApp).toEqual(testApp);
    expect(component.version.value).toEqual('1.0.0');
  });

  it('should emit form values on filter change', () => {
    const testAppIdStore = 'testApp';
    const testVersion = '1.0.0';
    const testStartDate = new Date('01-01-2018');
    const testEndDate = new Date('12-31-2018');

    component.setAppList(testAppList);
    component.appIdStore.setValue(testAppIdStore);
    component.onAppSelect(testAppIdStore);

    component.version.setValue(testVersion);

    component.statsFilterForm.updateValueAndValidity();

    spyOn(component.filterChange, 'emit');
    component.onDateChange([
      testStartDate,
      testEndDate
    ]);
    component.onFilterChange();

    const expectedValues: StatsFilterValues = {
      appIdStore: testAppIdStore,
      version: testVersion,
      startDate: new Date(testStartDate),
      endDate: new Date(testEndDate)
    };
    expect(component.filterChange.emit).toHaveBeenCalled();
    expect(component.filterChange.emit).toHaveBeenCalledWith(expectedValues);
  });

  it('should emit the comparison state when changes occur', () => {
    spyOn(component.compare, 'emit');
    component.toggleComparison();

    expect(component.compareText).toEqual('Stop Comparing');
    expect(component.compare.emit).toHaveBeenCalled();
    expect(component.compare.emit).toHaveBeenCalledWith(true);

    component.toggleComparison();
    expect(component.compareText).toEqual('Compare Apps');
    expect(component.compare.emit).toHaveBeenCalled();
    expect(component.compare.emit).toHaveBeenCalledWith(false);
  });
});
