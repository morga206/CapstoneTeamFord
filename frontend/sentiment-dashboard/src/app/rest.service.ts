
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class RestService {

  private API_URL = environment.backendUrl;

  constructor(private http: HttpClient) { }

  sayHello(name: string): Observable<HelloResponse> {
    const options = {
      headers: new HttpHeaders({'Content-Type' : 'application/json'})
    };
    const body = JSON.stringify({ 'name' : name });
    return this.http.post<HelloResponse>(this.API_URL + 'main', body, options);
  }
}

class HelloResponse {
  message: string;
}
