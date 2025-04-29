import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class TiposCarrerasService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getTiposCarreras(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/tipos_carreras_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR IGNORE INTO cat_cs_tipos_carreras (
          id, id_grado, nombre, descripcion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.id_grado,
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

  async consultarTiposCarreras(): Promise<{ id: number; nombre: string }[]> {
    const sql = `
      SELECT id, nombre FROM cat_cs_tipos_carreras ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  async consultarTiposCarrerasPorGrado(id_grado?: string): Promise<{ id: number; nombre: string }[]> {
    let sql = `
      SELECT id, nombre FROM cat_cs_tipos_carreras
    `;

    // Agregar filtro por id_grado si se proporciona
    if (id_grado) {
      sql += ' WHERE id_grado = ?';
    }

    sql += ' ORDER BY id;';

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, id_grado ? [id_grado] : []);
    return resultados;
  }

}
