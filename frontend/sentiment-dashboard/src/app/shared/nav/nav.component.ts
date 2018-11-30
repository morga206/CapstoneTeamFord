import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ChangePasswordComponent } from '../../auth/change-password/change-password.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  public isCollapsed = true;

  constructor(
    public auth: AuthService
  ) { }

  ngOnInit() {
  }

  onClickLogout() {
    this.auth.signOut();
  }

}
