import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

export interface CurpAprobadaSsas {
  id: number;
  curp: string;
  nombre?: string;
  paterno?: string;
  materno?: string;
  modulo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurpsAprobadasSsasService {

  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService) { }

  BulkInsertCurpAprobadaSsas(curpAprobadaSsas: CurpAprobadaSsas[]): Observable<any> {

  // for (let index = 0; index < curpAprobadaSsas.length; index++) {
  //     const element = curpAprobadaSsas[index];
      return this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/bulk-insert', { registros : curpAprobadaSsas });
    // }
    // return of(true);
  }

  deleteCurpAprobada(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/delete', { id: id });
  }
}
