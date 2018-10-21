import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule } from 'ng2-charts';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { NavComponent } from './shared/nav/nav.component';
import { DatepickerComponent } from './shared/datepicker/datepicker.component';
import { LoginComponent } from './login/login.component';
import { CardComponent } from './dashboard/card/card.component';
import { AuthService } from './auth/auth.service';
import { AmplifyService, AmplifyAngularModule} from 'aws-amplify-angular';
import { AuthGuardService } from './auth/auth.guard';
import { StatsComponent } from './dashboard/stats/stats.component';
import { FormComponent } from './dashboard/form/form.component';
import { AddAppComponent } from './settings/add-app/add-app.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SettingsComponent,
    NavComponent,
    DatepickerComponent,
    LoginComponent,
    CardComponent,
    StatsComponent,
    FormComponent,
    AddAppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    ChartsModule,
    HttpClientModule
  ],
  providers: [AmplifyService, AuthGuardService, AuthService],
  bootstrap: [AppComponent],
  entryComponents: [AddAppComponent]
})

export class AppModule { }
