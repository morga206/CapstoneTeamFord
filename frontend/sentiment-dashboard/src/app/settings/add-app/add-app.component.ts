import { Component, OnInit, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { App } from 'src/app/rest/domain';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-add-app',
  templateUrl: './add-app.component.html',
  styleUrls: ['./add-app.component.scss']
})
export class AddAppComponent implements OnInit {
  @Output() submit = new EventEmitter<App>();

  public addAppForm: FormGroup;
  public appName: AbstractControl;
  public appStore: AbstractControl;
  public appId: AbstractControl;

  constructor(public bsModalRef: BsModalRef, private fb: FormBuilder) { }

  ngOnInit() {
    this.addAppForm = this.fb.group({
      'appName': ['', Validators.required],
      'appStore': ['', Validators.required],
      'appId': ['', Validators.compose([Validators.required])]
    });
    this.appName = this.addAppForm.get('appName');
    this.appStore = this.addAppForm.get('appStore');
    this.appId = this.addAppForm.get('appId');
  }

  onSubmit() {
    this.submit.emit({
      name: this.appName.value,
      store: this.appStore.value,
      appId: this.appId.value
    });
    this.bsModalRef.hide();
  }

  onStoreChange() {
    const appStorePattern = '[0-9]+';
    const googlePlayPattern = '[0-9a-zA-Z_.]+';

    const store = this.appStore.value;

    if (store === 'App Store') {
      this.appId.setValidators([Validators.required, Validators.pattern(appStorePattern)]);
    } else if (store === 'Google Play') {
      this.appId.setValidators([Validators.required, Validators.pattern(googlePlayPattern)]);
    }

    this.appId.updateValueAndValidity();
  }
}
