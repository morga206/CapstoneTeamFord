import { Component, Input, HostBinding, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  readonly ALERT_TIMEOUT = 3000;
  readonly LOADING_TIMEOUT = 10000;

  @HostBinding('class') class = 'w-100';

  loading = false;
  success = false;
  timeout = false;
  error = '';

  alertTimeout: any;
  loadingTimeout: any;

  constructor() {
  }

  startLoading() {
    // Show spinner
    this.loading = true;
    this.loadingTimeout = setTimeout(() => {
      this.success = false;
      this.error = 'Failed to fetch data: timeout reached';
      this.loading = false;
      this.timeout = true;
    }, this.LOADING_TIMEOUT);
  }

  stopLoading() {
    // Hide spinner (no alerts shown)
    this.loading = false;
    clearTimeout(this.loadingTimeout);
  }

  showSuccessAlert() {
    this.success = true;
    this.error = '';
    this.stopLoading();
    clearTimeout(this.alertTimeout);
    clearTimeout(this.loadingTimeout);
    this.alertTimeout = setTimeout(() => {
        this.success = false;
        this.error = '';
      }, this.ALERT_TIMEOUT);
  }

  showErrorAlert(message: string) {
    this.error = message;
    this.success = false;
    this.stopLoading();
    clearTimeout(this.alertTimeout);
    clearTimeout(this.loadingTimeout);
    this.alertTimeout = setTimeout(() => {
        this.success = false;
        this.error = '';
      }, this.ALERT_TIMEOUT);
  }

}
