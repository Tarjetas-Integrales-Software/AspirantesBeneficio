import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  
  login(credentials: { email: string, password: string}): Observable<any> {
    return this.http.post(environment.apiUrl + "/login", credentials);
  }

  constructor() { }
}
