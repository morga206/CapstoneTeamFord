import { TestBed, async } from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import { AppComponent } from './app.component';
import { NavComponent } from './shared/nav/nav.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';
import { AuthService } from './auth/auth.service';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        NavComponent,
        ChangePasswordComponent
      ],
      imports: [RouterTestingModule, CollapseModule, ReactiveFormsModule, ModalModule.forRoot()],
      providers: [AuthService]
    }).compileComponents();
  });
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
  it('should render the nav', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('nav')).toBeTruthy();
  });
});
