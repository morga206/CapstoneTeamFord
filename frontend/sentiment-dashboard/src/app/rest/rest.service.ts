
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

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private apiKey: string;
  private API_URL = environment.backendUrl;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.auth.getIdToken().subscribe(result => {
      this.apiKey = result;
    }, error => {
      console.log(error);
    });
  }

  getFilterList(): Observable<FilterListResponse> {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    return this.http.get<FilterListResponse>(this.API_URL + 'apps', options);
  }

  getSentimentStats(appIdStore: string, version: string, startDate: Date, endDate: Date, stats: StatRequest[]) {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    const body = JSON.stringify({
      appIdStore: appIdStore,
      version: version,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stats: stats
    });
    return this.http.post<StatResponse>(this.API_URL + 'stats', body, options);
  }

  getSettings(names: string[]): Observable<SettingResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      names: names
    });
    return this.http.post<SettingResponse>(this.API_URL + 'settings/get', body, options);
  }

  setSettings(settings: Setting[]): Observable<SettingResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      settings: settings
    });
    return this.http.post<SettingResponse>(this.API_URL + 'settings/set', body, options);
  }

  getAppList(): Observable<AppListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'GET'
    });
    return this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, options);
  }

  addApp(app: App): Observable<AppListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'ADD',
      app: app
    });
    return this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, options);
  }

  deleteApp(app: App): Observable<AppListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'DELETE',
      app: app
    });
    return this.http.post<AppListResponse>(this.API_URL + 'settings/apps', body, options);
  }

  getIgnoreList(): Observable<IgnoreListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'GET'
    });
    return this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, options);
  }

  addKeyword(keyword: string): Observable<IgnoreListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'ADD',
      keyword: keyword
    });
    return this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, options);
  }

  deleteKeyword(keyword: string): Observable<IgnoreListResponse> {
    const options = {
      headers: new HttpHeaders(
        {
          'Content-Type' : 'application/json',
          'Authorization' : this.apiKey
        })
    };
    const body = JSON.stringify({
      command: 'DELETE',
      keyword: keyword
    });
    return this.http.post<IgnoreListResponse>(this.API_URL + 'settings/keywords', body, options);
  }
}
