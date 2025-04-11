import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);

  getOpcionesMenu(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/opciones_menu');
  }
}
