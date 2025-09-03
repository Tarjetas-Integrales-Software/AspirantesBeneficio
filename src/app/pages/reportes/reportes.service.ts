import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor(private http: HttpClient) { }

  getReportes(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/cat_reportes');
  }

  getReporte(url: string, body: any): Observable<any> {
    return this.http.post(environment.apiUrl + url, { ...body });
  }

  getReportesByIdUser(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/reportes/aspben_reportes_por_id_user');
  }
}
