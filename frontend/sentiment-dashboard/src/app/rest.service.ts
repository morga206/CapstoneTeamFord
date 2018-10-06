
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export interface StatRequest {
  [statName: string]: string[] | undefined
}

export interface StatResponse {
  [statName: string]: string[] | number[] | { [keyword: string]: number } | any // TODO Remove "any," just for testing"
}

export class RestService {

  private API_URL = environment.backendUrl;

  constructor(private http: HttpClient) { }

  getSentimentStats(id: string, version: string, startDate: Date, endDate: Date, stats: StatRequest[]) {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    const body = JSON.stringify({
      id: id,
      version: version,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stats: stats
    });
    return this.http.post<StatResponse[]>(this.API_URL + 'main', body, options);
  }
}
