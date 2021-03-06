import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './../auth/auth.service';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  username: AbstractControl;
  password: AbstractControl;

  modalRef: BsModalRef;
  error: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private modalService: BsModalService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  initForm() {
    this.loginForm = this.fb.group({
      'username': ['', Validators.required],
      'password': ['', Validators.required]
    });
    this.username = this.loginForm.get('username');
    this.password = this.loginForm.get('password');
  }

  onSubmitLogin(value: any) {
    const username = value.username, password = value.password;
    this.error = '';
    this.auth.signIn(username, password).subscribe(
      result => {
        this.auth.isAdmin().subscribe(val => this.auth.setAdmin(val));
        this.router.navigate(['/']);
      },
      err => {
        this.error = err.message;
      });
  }
}
