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
  public slackReport: AbstractControl;

  public idFormatMessage = '';

  constructor(public bsModalRef: BsModalRef, private fb: FormBuilder) { }

  ngOnInit() {
    this.addAppForm = this.fb.group({
      'appName': ['', Validators.required],
      'appStore': ['', Validators.required],
      'appId': ['', Validators.required],
      'slackReport': ['']
    });
    this.appName = this.addAppForm.get('appName');
    this.appStore = this.addAppForm.get('appStore');
    this.appId = this.addAppForm.get('appId');
    this.slackReport = this.addAppForm.get('slackReport');
  }

  onSubmit() {
    this.submit.emit({
      name: this.appName.value,
      store: this.appStore.value,
      appId: this.appId.value,
      slackReport: this.slackReport.value
    });
    this.bsModalRef.hide();
  }

  onStoreChange() {
    const appStorePattern = '[0-9]+';
    const googlePlayPattern = '[0-9a-zA-Z_.]+';

    const store = this.appStore.value;

    if (store === 'App Store') {
      this.appId.setValidators([Validators.required, Validators.pattern(appStorePattern)]);
      this.idFormatMessage = 'For the App Store, app IDs are formatted as 9-digit numbers.';
    } else if (store === 'Google Play') {
      this.appId.setValidators([Validators.required, Validators.pattern(googlePlayPattern)]);
      this.idFormatMessage = 'For Google Play, app IDs are formatted as Java package names in reverse domain structure.';
    }

    this.appId.updateValueAndValidity();
  }
}
