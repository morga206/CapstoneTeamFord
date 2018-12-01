import { Component, OnInit, OnDestroy, AfterContentInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RestService } from '../rest/rest.service';
import { App } from '../rest/domain';
import { AddAppComponent } from './add-app/add-app.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterContentInit, OnDestroy {
  public appList: App[];
  @ViewChild('appListLoader') appListLoader: LoaderComponent;
  private appListSubscription: Subscription;
  private modalSubscription?: Subscription;

  public ignoreList: string[];
  @ViewChild('ignoreListLoader') ignoreListLoader: LoaderComponent;
  private ignoreListSubscription: Subscription;
  public ignoreListForm: FormGroup;
  public addKeyword: AbstractControl;

  @ViewChild('scrapingLoader') scrapingLoader: LoaderComponent;
  private scrapingFormGetSubscription: Subscription;
  private scrapingFormSetSubscription: Subscription;
  public scrapingForm: FormGroup;
  public pollingInterval: AbstractControl;

  @ViewChild('dashboardLoader') dashboardLoader: LoaderComponent;
  private dashboardFormGetSubscription: Subscription;
  private dashboardFormSetSubscription: Subscription;
  public dashboardForm: FormGroup;
  public refreshInterval: AbstractControl;

  @ViewChild('slackLoader') slackLoader: LoaderComponent;
  private slackFormGetSubscription: Subscription;
  private slackFormSetSubscription: Subscription;
  public slackForm: FormGroup;
  public postingChannel: AbstractControl;
  public postingInterval: AbstractControl;

  constructor(private fb: FormBuilder, private rest: RestService, private modalService: BsModalService) { }

  ngOnInit() {
    this.dashboardForm = this.fb.group({
      'refreshInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.refreshInterval = this.dashboardForm.get('refreshInterval');

    this.ignoreListForm = this.fb.group({
      'addKeyword': ['', Validators.required]
    });
    this.addKeyword = this.ignoreListForm.get('addKeyword');

    this.scrapingForm = this.fb.group({
      'pollingInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.pollingInterval = this.scrapingForm.get('pollingInterval');

    this.slackForm = this.fb.group({
      'postingChannel': ['', Validators.compose([Validators.required, Validators.pattern('[a-zA-Z0-9-_]+')])],
      'postingInterval': ['', Validators.compose([Validators.required, Validators.pattern('[0-9]+')])]
    });
    this.postingChannel = this.slackForm.get('postingChannel');
    this.postingInterval = this.slackForm.get('postingInterval');
  }

  ngAfterContentInit() {
    this.dashboardLoader.startLoading();
    this.dashboardFormGetSubscription = this.rest.getSettings(['refreshInterval'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.dashboardLoader.showErrorAlert(response.message);
      } else {
        response.settings.forEach((setting) => this.dashboardForm.get(setting.name).setValue(setting.value));
        this.dashboardLoader.stopLoading();
      }
    });

    this.appListLoader.startLoading();
    this.appListSubscription = this.rest.getAppList()
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListLoader.showErrorAlert(response.message);
      } else {
        this.appList = response.appList;
        this.appListLoader.stopLoading();
      }
    });

    this.ignoreListLoader.startLoading();
    this.ignoreListSubscription = this.rest.getIgnoreList()
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.ignoreListLoader.showErrorAlert(response.message);
      } else {
        this.ignoreList = response.ignoreList;
        this.ignoreListLoader.stopLoading();
      }
    });

    this.scrapingLoader.startLoading();
    this.scrapingFormGetSubscription = this.rest.getSettings(['pollingInterval'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.scrapingLoader.showErrorAlert(response.message);
      } else {
        response.settings.forEach((setting) => this.scrapingForm.get(setting.name).setValue(setting.value));
        this.scrapingLoader.stopLoading();
      }
    });

    this.slackLoader.startLoading();
    this.slackFormGetSubscription = this.rest.getSettings(['postingChannel', 'postingInterval'])
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.slackLoader.showErrorAlert(response.message);
      } else {
        response.settings.forEach((setting) => this.slackForm.get(setting.name).setValue(setting.value));
        this.slackLoader.stopLoading();
      }
    });
  }

  ngOnDestroy() {
    if (this.dashboardFormGetSubscription !== undefined) {
      this.dashboardFormGetSubscription.unsubscribe();
    }

    if (this.dashboardFormSetSubscription !== undefined) {
      this.dashboardFormSetSubscription.unsubscribe();
    }

    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

    if (this.ignoreListSubscription !== undefined) {
      this.ignoreListSubscription.unsubscribe();
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

    this.appListLoader.startLoading();
    this.appListSubscription = this.rest.addApp(app)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListLoader.showErrorAlert(response.message);
      } else {
        this.appList = response.appList;
        this.appListLoader.showSuccessAlert();
      }
    });
  }

  onSlackCheckbox(app: App, event: any) {
    // Update app with new slack report value
    app.slackReport = event.target.checked;

    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

    this.appListLoader.startLoading();
    this.appListSubscription = this.rest.updateApp(app)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListLoader.showErrorAlert(response.message);
      } else {
        console.log(response.appList);
        this.appList = response.appList;
        this.appListLoader.showSuccessAlert();
      }
    });
  }

  onDeleteApp(app: App) {
    if (this.appListSubscription !== undefined) {
      this.appListSubscription.unsubscribe();
    }

    this.appListLoader.startLoading();
    this.appListSubscription = this.rest.deleteApp(app)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.appListLoader.showErrorAlert(response.message);
      } else {
        this.appList = response.appList;
        this.appListLoader.showSuccessAlert();
      }
    });
  }

  onDashboardSubmit() {
    this.dashboardLoader.startLoading();
    this.dashboardFormSetSubscription = this.rest.setSettings([
      { name: 'refreshInterval', value: this.refreshInterval.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.dashboardLoader.showErrorAlert(response.message);
      } else {
        this.dashboardLoader.showSuccessAlert();
      }
    });
  }

  onAddKeyword() {
    if (this.addKeyword.invalid) {
      return;
    }

    if (this.ignoreListSubscription !== undefined) {
      this.ignoreListSubscription.unsubscribe();
    }

    this.ignoreListLoader.startLoading();
    this.ignoreListSubscription = this.rest.addKeyword(this.addKeyword.value)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.ignoreListLoader.showErrorAlert(response.message);
      } else {
        this.ignoreList = response.ignoreList;
        this.ignoreListLoader.showSuccessAlert();
      }
    });

    this.addKeyword.setValue('');
    this.addKeyword.updateValueAndValidity();
  }

  onDeleteKeyword(keyword: string) {
    if (this.ignoreListSubscription !== undefined) {
      this.ignoreListSubscription.unsubscribe();
    }

    this.ignoreListLoader.startLoading();
    this.ignoreListSubscription = this.rest.deleteKeyword(keyword)
    .subscribe((response) => {
      if (response.status === 'ERROR') {
        this.ignoreListLoader.showErrorAlert(response.message);
      } else {
        this.ignoreList = response.ignoreList;
        this.ignoreListLoader.showSuccessAlert();
      }
    });
  }

  onScrapingSubmit() {
    this.scrapingLoader.startLoading();
    this.scrapingFormSetSubscription = this.rest.setSettings([
      { name: 'pollingInterval', value: this.pollingInterval.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.scrapingLoader.showErrorAlert(response.message);
      } else {
        this.scrapingLoader.showSuccessAlert();
      }
    });
  }

  onSlackSubmit() {
    this.slackLoader.startLoading();
    this.slackFormSetSubscription = this.rest.setSettings([
      { name: 'postingChannel', value: this.postingChannel.value },
      { name: 'postingInterval', value: this.postingInterval.value }
    ]).subscribe((response) => {
      if (response.status === 'ERROR') {
        this.slackLoader.showErrorAlert(response.message);
      } else {
        this.slackLoader.showSuccessAlert();
      }
    });
  }

}
