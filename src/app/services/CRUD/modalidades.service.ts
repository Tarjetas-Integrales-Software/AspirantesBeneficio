import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ModalidadesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getModalidades(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/modalidades_with_joins');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO cat_ct_modalidades (
          id, id_tipo_beneficio, nombre, descripcion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.id_tipo_beneficio,
        item.nombre,
        item.descripcion,
        item.created_id,
        item.updated_id,
        item.deleted_id,
        item.created_at,
        item.updated_at,
        item.deleted_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarModalidades(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT id, nombre 
      FROM cat_ct_modalidades 
      WHERE id_tipo_beneficio = 2 
      ORDER BY nombre;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }
}
