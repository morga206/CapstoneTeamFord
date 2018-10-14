import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    public auth: AuthService,
    public router: Router
    ) {}

    canActivate(): Observable<boolean> {
        return this.auth.loggedIn.pipe(tap(loggedIn => {
          if (!loggedIn) {
            this.router.navigate(['/login']);
          }
        }))
  }

}
