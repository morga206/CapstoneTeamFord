import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error messages', async () => {
    component.showSuccessAlert();
    expect(component.success).toBeTruthy();
    expect(component.error).toEqual('');
    expect(component.loading).toBeFalsy();
    expect(component.timeout).toBeFalsy();
    expect(component.alertTimeout).toBeTruthy();
  });

  it('should display a success message', async() => {
    component.showErrorAlert('Test Error Message');
    expect(component.success).toBeFalsy();
    expect(component.error).toEqual('Test Error Message');
    expect(component.loading).toBeFalsy();
    expect(component.timeout).toBeFalsy();
    expect(component.alertTimeout).toBeTruthy();
  });
});
