import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class GradosService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getGrados(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/grados_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR IGNORE INTO cat_cs_grados (
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

  async consultarGrados(): Promise<{ id: number; nombre: string }[]> {
    const sql = `
      SELECT id, nombre FROM cat_cs_grados ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }
}
