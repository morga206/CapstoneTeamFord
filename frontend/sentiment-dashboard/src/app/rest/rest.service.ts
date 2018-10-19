
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';
import { AppInfo, StatResponse, StatRequest, Setting, SettingResponse } from './domain';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private API_URL = environment.backendUrl;

  constructor(private http: HttpClient) { }

  getApps(): Observable<{ [id: string]: AppInfo }> {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    return this.http.get<{ [id: string]: AppInfo }>(this.API_URL + 'apps', options);
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
    return this.http.post<StatResponse[]>(this.API_URL + 'stats', body, options);
  }

  getSettings(names: string[]): Observable<SettingResponse> {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    const body = JSON.stringify({
      names: names
    });

    return this.http.post<SettingResponse>(this.API_URL + 'settings/get', body, options);
  }

  setSettings(settings: Setting[]): Observable<SettingResponse> {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    const body = JSON.stringify({
      settings: settings
    });
    return this.http.post<SettingResponse>(this.API_URL + 'settings/set', body, options);
  }
}
