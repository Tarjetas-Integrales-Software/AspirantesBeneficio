import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {}

  getModulos(): Observable<any> {
    return this.http.get('http://127.0.0.1:8000/api/v1/lic/aspben/modulos_all');
    // return this.http.get(environment.apiUrl + '/lic/aspben/modulos_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO cat_ct_modulos (
          id, nombre, descripcion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
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

  async consultarModulos(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT id, nombre
      FROM cat_ct_modulos
      WHERE deleted_at IS NULL
      ORDER BY nombre;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

}
