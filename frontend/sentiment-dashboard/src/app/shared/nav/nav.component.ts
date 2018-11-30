import { Component, OnInit, TemplateRef } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ChangePasswordComponent } from '../../auth/change-password/change-password.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  public isCollapsed = true;
  modalRef: BsModalRef;

  constructor(
    public auth: AuthService,
    private modalService: BsModalService
  ) { }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  ngOnInit() {
  }

  onClickLogout() {
    this.auth.signOut();
  }

}
