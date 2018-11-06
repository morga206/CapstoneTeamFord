import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RestService } from '../rest/rest.service';
import { App } from '../rest/domain';
import { AddAppComponent } from './add-app/add-app.component';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {
  public appList: App[];
  public appListError = '';
  public appListSuccess = false;
  private appListSubscription: Subscription;
  private appListTimer: any;

  public scrapingForm: FormGroup;
  public pollingInterval: AbstractControl;
  public scrapingFormError = '';
  public scrapingFormSuccess = false;
  private scrapingFormGetSubscription: Subscription;
  private scrapingFormSetSubscription: Subscription;
  private scrapingFormTimer: any;

  public slackForm: FormGroup;
  public postingChannel: AbstractControl;
  public postingInterval: AbstractControl;

  public slackFormError = '';
  public slackFormSuccess = false;
  private slackFormGetSubscription: Subscription;
  private slackFormSetSubscription: Subscription;
  private slackFormTimer: any;

  private modalSubscription?: Subscription;

  constructor(private fb: FormBuilder, private rest: RestService, private modalService: BsModalService) { }

  ngOnInit() {
    this.scrapingForm = this.fb.group({
      'pollingInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.pollingInterval = this.scrapingForm.get('pollingInterval');

    this.slackForm = this.fb.group({
      'postingChannel': ['', Validators.compose([Validators.required, Validators.pattern('[a-zA-Z0-9-]+')])],
      'postingInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.postingChannel = this.slackForm.get('postingChannel');
    this.postingInterval = this.slackForm.get('postingInterval');
  }

  ngAfterViewInit() {
    this.appListSubscription = this.rest.getAppList()
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListError = response.message;
      } else {
        this.appList = response.appList;
      }
    });
    this.scrapingFormGetSubscription = this.rest.getSettings(['pollingInterval'])
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
    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

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

    if (this.modalSubscription !== undefined) {
      this.modalSubscription.unsubscribe();
    }
  }

  openModal() {
    const modalRef = this.modalService.show(AddAppComponent);
    this.modalSubscription = modalRef.content.submit.subscribe((data) => {
      this.onAddApp(data);
    });
  }

  onAddApp(app: App) {
    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

    this.appListSubscription = this.rest.addApp(app)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListError = response.message;
      } else {
        this.appListSuccess = true;
        this.appList = response.appList;
        clearTimeout(this.appListTimer);
        this.appListTimer = setTimeout(() => {
          this.appListSuccess = false;
        }, 3000);
      }
    });
  }

  onDeleteApp(app: App) {
    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

    this.appListSubscription = this.rest.deleteApp(app)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListError = response.message;
      } else {
        this.appListSuccess = true;
        this.appList = response.appList;
        setTimeout(() => {
          this.appListSuccess = false;
        }, 3000);
      }
    });
  }

  onScrapingSubmit() {
    this.scrapingFormSetSubscription = this.rest.setSettings([
      { name: 'pollingInterval', value: this.pollingInterval.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.scrapingFormError = response.message;
      } else {
        this.scrapingFormSuccess = true;
        clearTimeout(this.scrapingFormTimer);
        this.scrapingFormTimer = setTimeout(() => {
          this.scrapingFormSuccess = false;
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
        clearTimeout(this.slackFormTimer);
        this.slackFormTimer = setTimeout(() => {
          this.slackFormSuccess = false;
        }, 3000);
      }
    });
  }

}
