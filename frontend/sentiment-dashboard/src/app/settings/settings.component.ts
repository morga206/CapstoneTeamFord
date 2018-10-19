import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RestService } from '../rest/rest.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {
  public scrapingForm: FormGroup;
  public appStorePolling: AbstractControl;
  public playStorePolling: AbstractControl;

  public scrapingFormError = '';
  public scrapingFormSuccess = false;
  private scrapingFormGetSubscription: Subscription;
  private scrapingFormSetSubscription: Subscription;

  public slackForm: FormGroup;
  public postingChannel: AbstractControl;
  public postingInterval: AbstractControl;

  public slackFormError = '';
  public slackFormSuccess = false;
  private slackFormGetSubscription: Subscription;
  private slackFormSetSubscription: Subscription;

  constructor(private fb: FormBuilder, private rest: RestService) { }

  ngOnInit() {
    this.scrapingForm = this.fb.group({
      'appStorePolling': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
      'playStorePolling': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.appStorePolling = this.scrapingForm.get('appStorePolling');
    this.playStorePolling = this.scrapingForm.get('playStorePolling');

    this.slackForm = this.fb.group({
      'postingChannel': ['', Validators.compose([Validators.required, Validators.pattern('[a-zA-Z0-9-]+')])],
      'postingInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.postingChannel = this.slackForm.get('postingChannel');
    this.postingInterval = this.slackForm.get('postingInterval');
  }

  ngAfterViewInit() {
    this.scrapingFormGetSubscription = this.rest.getSettings(['appStorePolling', 'playStorePolling'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.scrapingFormError = response.message;
      } else {
        response.settings.forEach((setting) => this.scrapingForm.get(setting.name).setValue(setting.value));
      }
    });

    this.slackFormGetSubscription = this.rest.getSettings(['postingChannel', 'postingInterval'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.slackFormError = response.message;
      } else {
        response.settings.forEach((setting) => this.slackForm.get(setting.name).setValue(setting.value));
      }
    });
  }

  ngOnDestroy() {
    if (this.scrapingFormGetSubscription !== undefined) {
      this.scrapingFormGetSubscription.unsubscribe();
    }

    if (this.scrapingFormSetSubscription !== undefined) {
      this.scrapingFormSetSubscription.unsubscribe();
    }

    if (this.slackFormGetSubscription !== undefined) {
      this.slackFormGetSubscription.unsubscribe();
    }

    if (this.slackFormSetSubscription !== undefined) {
      this.slackFormSetSubscription.unsubscribe();
    }
  }

  onScrapingSubmit() {
    this.scrapingFormSetSubscription = this.rest.setSettings([
      { name: 'appStorePolling', value: this.appStorePolling.value },
      { name: 'playStorePolling', value: this.playStorePolling.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.scrapingFormError = response.message;
      } else {
        this.scrapingFormSuccess = true;
        setInterval(() => {
          this.slackFormSuccess = false;
        }, 3000);
      }
    });
  }

  onSlackSubmit() {
    this.slackFormSetSubscription = this.rest.setSettings([
      { name: 'postingChannel', value: this.postingChannel.value },
      { name: 'postingInterval', value: this.postingInterval.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.slackFormError = response.message;
      } else {
        this.slackFormSuccess = true;
        setInterval(() => {
          this.slackFormSuccess = false;
        }, 3000);
      }
    });
  }

}
