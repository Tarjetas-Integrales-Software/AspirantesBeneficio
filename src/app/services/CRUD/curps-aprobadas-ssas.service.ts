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
    return this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/bulk-insert', { registros : curpAprobadaSsas });
  }


  BulkInsertCurpAprobadaSsas_InBatches(data: any[], batchSize: number = 250): Observable<any> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    batches.forEach((batch, index) => {
      this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/bulk-insert', { registros: batch }).subscribe(response => {
        console.log(`Lote ${index + 1} enviado correctamente`, response);
      });
    });

    return of(null);
  }



  deleteCurpAprobada(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/delete', { id: id });
  }
}
