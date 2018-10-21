import { Component, OnInit, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { App } from 'src/app/rest/domain';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-app',
  templateUrl: './add-app.component.html',
  styleUrls: ['./add-app.component.scss']
})
export class AddAppComponent implements OnInit {
  public addAppForm: FormGroup;
  public appName: AbstractControl;
  public appStore: AbstractControl;
  public appId: AbstractControl;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) { }

  ngOnInit() {
    this.addAppForm = this.fb.group({
      'appName': ['', Validators.required],
      'appStore': ['', Validators.required],
      'appId': ['', Validators.compose([Validators.required, Validators.pattern('[0-9a-zA-Z_.]+')])]
    });
    this.appName = this.addAppForm.get('appName');
    this.appStore = this.addAppForm.get('appStore');
    this.appId = this.addAppForm.get('appId');
  }

  onSubmit() {
    this.activeModal.close({
      name: this.appName.value,
      store: this.appStore.value,
      appId: this.appId.value
    });
  }
}
