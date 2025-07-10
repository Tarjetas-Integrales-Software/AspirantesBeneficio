import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Necesitamos importar el servicio de base de datos para acceder a SQLite
import { DatabaseService } from '../database.service';


@Injectable({
  providedIn: 'root'
})
export class AtencionSinCitaService {
  private http = inject(HttpClient);
  private databaseService = inject(DatabaseService);

  constructor() { }

  get(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/atencion_sin_cita_all');
  }

  getCaratula(body: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/atencion_sin_cita_caratula', body);
  }
}
