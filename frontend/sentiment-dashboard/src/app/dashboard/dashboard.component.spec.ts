import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DatepickerComponent} from '../shared/datepicker/datepicker.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { CardComponent } from './card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { FormComponent } from './form/form.component';
import { StatsComponent } from './stats/stats.component';
import { AuthService } from '../auth/auth.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardComponent, DatepickerComponent, CardComponent, FormComponent, StatsComponent ],
      imports: [NgbModule, ReactiveFormsModule, FormsModule, ChartsModule, HttpClientModule],
      providers: [AuthService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
