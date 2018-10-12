import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { from } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import Amplify, { Auth } from 'aws-amplify';
import { environment } from './../../environments/environment';


@Injectable()
export class AuthService {
  public loggedIn: BehaviorSubject<boolean>;

  constructor(private router: Router) {
    Amplify.configure(environment.amplify);
    this.loggedIn = new BehaviorSubject<boolean>(false);
  }

  public signIn(username, password) {
    return from(Auth.signIn(username, password))
      .pipe(
        tap(() => this.loggedIn.next(true))
      );
  }

  public signOut() {
    from(Auth.signOut()).subscribe(
        result => {
          this.loggedIn.next(false);
        },
        error => console.log(error)
      );
  }

  public isAuthenticated(): Observable<boolean> {
    return from(Auth.currentAuthenticatedUser())
      .pipe(
        map(result => {
          this.loggedIn.next(true);
          return true;
        }),
        catchError(error => {
          this.loggedIn.next(false);
          return of(false);
        })
      );
  }
}