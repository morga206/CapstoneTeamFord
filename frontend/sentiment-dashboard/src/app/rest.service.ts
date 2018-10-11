
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {environment} from '../environments/environment';

export interface StatRequest {
  [statName: string]: string[] | undefined;
}

export interface StatResponse {
  [statName: string]: string[] | number[] | { [keyword: string]: number } | any; // TODO Remove "any," just for testing"
}

export interface AppInfo {
  minDate: string;
  maxDate: string;
  versions: string[];
}

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
}
