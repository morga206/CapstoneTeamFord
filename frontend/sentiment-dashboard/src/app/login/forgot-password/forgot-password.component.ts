import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordForm: FormGroup;
  isValid: boolean;
  resetErrorMessage: string;
  verifyCodeErrorMessage: string;
  username: string;
  passwordChanged: boolean;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) { this.isValid = false;
      this.passwordChanged = false;
    }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.forgotPasswordForm = this.fb.group({
      'forgotUsername': ['', Validators.required],
      'verifyCode': [''],
      'newPassword': ['']
    });
  }

  onResetPassword(value: any) {
    this.username = value.forgotUsername;
    this.auth.forgotPassword(this.username)
    .then(data => {
      this.isValid = true;
      this.resetErrorMessage = '';
    })
    .catch(err => {
      console.log(err);
      this.resetErrorMessage = err.message;
      this.isValid = false;
    });
  }

  onChangePassword(value: any) {
    const verifyCode = value.verifyCode;
    const newPassword = value.newPassword;
    this.auth.forgotPasswordSubmit(this.username, verifyCode, newPassword)
    .then(data => {
      this.verifyCodeErrorMessage = '';
      this.passwordChanged = true;
      this.forgotPasswordForm.reset();
    })
    .catch(err => {
      console.log(err);
      this.verifyCodeErrorMessage = err.message;
      this.passwordChanged = false;
    });
  }
}
