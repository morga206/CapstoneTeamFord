import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAppComponent } from './add-app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';

describe('AddAppComponent', () => {
  let component: AddAppComponent;
  let fixture: ComponentFixture<AddAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddAppComponent ],
      imports: [ ReactiveFormsModule, ModalModule ],
      providers: [ BsModalRef ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be value when all fields are filled', () => {
    component.appName.setValue('Test Name');
    component.appStore.setValue('Google Play');
    component.appId.setValue('com.ford.test');
    component.addAppForm.updateValueAndValidity();

    expect(component.addAppForm.valid).toBeTruthy();
  });

  it('should be invalid if any field is not filled out', () => {
    expect(component.addAppForm.valid).toBeFalsy();

    component.appName.setValue('Test Name');
    component.addAppForm.updateValueAndValidity();
    expect(component.addAppForm.valid).toBeFalsy();

    component.appStore.setValue('Google Play');
    component.addAppForm.updateValueAndValidity();
    expect(component.addAppForm.valid).toBeFalsy();

    component.appName.setValue('');
    component.appId.setValue('com.ford.test');
    component.addAppForm.updateValueAndValidity();
    expect(component.addAppForm.valid).toBeFalsy();

    component.appName.setValue('Test Name');
    component.addAppForm.updateValueAndValidity();
    expect(component.addAppForm.valid).toBeTruthy();
  });

  it('should not submit if the appId format is invalid', () => {
    component.appName.setValue('Test Name');
    component.appStore.setValue('Google Play');
    component.appId.setValue('com.ford.test&');
    component.addAppForm.updateValueAndValidity();

    expect(component.addAppForm.valid).toBeFalsy();

    component.appId.setValue('com.ford.test123');
    component.addAppForm.updateValueAndValidity();

    expect(component.addAppForm.valid).toBeTruthy();
  });
});
