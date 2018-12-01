
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';
import { StatResponse,
  StatRequest,
  Setting,
  SettingResponse,
  App,
  AppListResponse,
  FilterListResponse,
  IgnoreListResponse } from './domain';
import { AuthService } from '../auth/auth.service';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private apiKey$: Observable<string>;
  private API_URL = environment.backendUrl;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.apiKey$ = this.auth.getIdToken();
  }

  getFilterList(): Observable<FilterListResponse> {
    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
          'Content-Type' : 'application/json',
          'Authorization': key
        })),
      switchMap((headers) => this.http.get<FilterListResponse>(this.API_URL + 'apps', { headers: headers }))
    );
  }

  getSentimentStats(appIdStore: string, version: string, startDate: Date, endDate: Date, stats: StatRequest[]) {
    const body = JSON.stringify({
      appIdStore: appIdStore,
      version: version,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stats: stats
    });
    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
          'Content-Type' : 'application/json',
          'Authorization': key
        })),
      switchMap((headers) => this.http.post<StatResponse>(this.API_URL + 'stats', body, { headers: headers }))
    );
  }

  getSettings(names: string[]): Observable<SettingResponse> {
    const body = JSON.stringify({
      names: names
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
          'Content-Type' : 'application/json',
          'Authorization': key
        })),
      switchMap((headers) => this.http.post<SettingResponse>(this.API_URL + 'settings/get', body, { headers: headers }))
    );
  }

  setSettings(settings: Setting[]): Observable<SettingResponse> {
    const body = JSON.stringify({
      settings: settings
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<SettingResponse>(this.API_URL + 'settings/set', body, { headers: headers }))
    );
  }

  getAppList(): Observable<AppListResponse> {
    const body = JSON.stringify({
      command: 'GET'
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, { headers: headers }))
    );
  }

  addApp(app: App): Observable<AppListResponse> {
    const body = JSON.stringify({
      command: 'ADD',
      app: app
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, { headers: headers }))
    );
  }

  updateApp(app: App): Observable<AppListResponse> {
    const body = JSON.stringify({
      command: 'UPDATE',
      app: app
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, { headers: headers }))
    );
  }

  deleteApp(app: App): Observable<AppListResponse> {
    const body = JSON.stringify({
      command: 'DELETE',
      app: app
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, { headers: headers }))
    );
  }

  getIgnoreList(): Observable<IgnoreListResponse> {
    const body = JSON.stringify({
      command: 'GET'
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, { headers: headers }))
    );
  }

  addKeyword(keyword: string): Observable<IgnoreListResponse> {
    const body = JSON.stringify({
      command: 'ADD',
      keyword: keyword
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, { headers: headers }))
    );
  }

  deleteKeyword(keyword: string): Observable<IgnoreListResponse> {
    const body = JSON.stringify({
      command: 'DELETE',
      keyword: keyword
    });

    return this.apiKey$.pipe(
      map((key) => new HttpHeaders({
        'Content-Type' : 'application/json',
        'Authorization': key
      })),
      switchMap((headers) => this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, { headers: headers }))
    );
  }
}
