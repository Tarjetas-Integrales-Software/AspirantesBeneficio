import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class OpcionesGeneralesService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getOpcionesGenerales(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/opciones_generales_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO cs_opciones_generales (
        opcion_general, orden, valor, agrupador, descripcion
        ) VALUES (?,?,?,?,?)
      `;
      const params = [
        item.opcion_general
        ,item.orden
        ,item.valor
        ,item.agrupador
        ,item.descripcion
      ];

      await this.databaseService.execute(sql, params);
    }
  }
}
