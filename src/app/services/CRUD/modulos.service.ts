import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private http = inject(HttpClient);

  constructor() {

  }

  getModulos(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/modulos_all');
  }
}
