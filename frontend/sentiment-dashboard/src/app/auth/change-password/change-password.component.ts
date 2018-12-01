import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Auth } from 'aws-amplify';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  passwordChanged = false;
  error: string;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.changePasswordForm = this.fb.group({
      'oldPassword': ['', Validators.required],
      'newPassword': ['', Validators.required]
    });
  }

  onSubmitPassword(value: any) {
    const oldPassword = value.oldPassword, newPassword = value.newPassword;
    Auth.currentAuthenticatedUser()
    .then(user => {
        return Auth.changePassword(user, oldPassword, newPassword);
    })
    .then(data => {
      this.error = '';
      this.passwordChanged = true;
      this.changePasswordForm.reset();
    })
    .catch(err => {
      this.error = err.message;
      this.passwordChanged = false;
    });
  }
}
