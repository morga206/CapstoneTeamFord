import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  modalRef: BsModalRef;

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
  }

  onSubmitLogin(value: any) {
    const username = value.username, password = value.password;
    this.auth.signIn(username, password).subscribe(
      result => {
        this.auth.isAdmin().subscribe(val => this.auth.setAdmin(val));
        this.router.navigate(['/']);
      },
      error => {
        console.log(error);
      });
  }
}
