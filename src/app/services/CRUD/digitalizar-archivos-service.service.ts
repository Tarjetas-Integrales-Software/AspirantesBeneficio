import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DatabaseService } from '../../services/database.service';



@Injectable({
  providedIn: 'root'
})
export class DigitalizarArchivosServiceService {

  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService) { }

  BulkInsert_InBatches(data: any[], batchSize: number = 100): Observable<any> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    batches.forEach((batch, index) => {
      this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/bulk-insert', { registros: batch }).subscribe(response => {
        console.log(`Lote ${index + 1} enviado correctamente`, response);
      });
    });

    return of(null);
  }



  delete(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/delete', { id: id });
  }
}
