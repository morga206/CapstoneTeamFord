import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MyDateRangePickerModule } from 'mydaterangepicker';
import { FormComponent, StatsFilterValues } from './form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AppInfo } from 'src/app/rest/domain';

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
      imports: [ ReactiveFormsModule, MyDateRangePickerModule ]
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
    const testStartDate = '01-01-2018';
    const testEndDate = '12-31-2018';

    component.setAppList(testAppList);
    component.appIdStore.setValue(testAppIdStore);
    component.onAppSelect(testAppIdStore);

    component.version.setValue(testVersion);
    component.startDate.setValue(testStartDate);
    component.endDate.setValue(testEndDate);

    component.statsFilterForm.updateValueAndValidity();

    spyOn(component.filterChange, 'emit');
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
