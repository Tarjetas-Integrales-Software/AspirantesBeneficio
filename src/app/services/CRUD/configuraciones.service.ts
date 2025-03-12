import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionesService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getConfiguraciones(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/configuraciones_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO cat_ct_configuraciones (
          id, id_equipo, clave, valor, descripcion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.id_equipo,
        item.clave,
        item.valor,
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

  async insertOrUpdateConfiguracion(clave: string, valor: string): Promise<void> {

      const sql = `
       INSERT INTO cat_ct_configuraciones (id_equipo, clave, valor)
        VALUES (1, ?, ?)
        ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;
    `;
      const params = [
        clave,
        valor
      ];

      await this.databaseService.execute(sql, params);

  }

  async updateConfiguracionByClave(clave: string, valor: string): Promise<void> {

      const sql = `
      UPDATE cat_ct_configuraciones
      SET valor = ?
      WHERE clave = ?
      ORDER BY id;
    `;
      const params = [
        valor,
        clave,
      ];

      await this.databaseService.execute(sql, params);

  }

  async consultarConfiguraciones(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT id, clave, valor
      FROM cat_ct_configuraciones
      ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  async consultarConfiguracionPorClave(clave?: string): Promise<{valor: string}[]> {
    let sql = `
      SELECT valor FROM cat_ct_configuraciones
    `;

    // Agregar filtro por id_grado si se proporciona
    if (clave) {
      sql += ' WHERE clave = ?';
    }

    sql += ' ORDER BY id;';

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, clave ? [clave] : []);
    console.log(resultados);
    return resultados;
  }

}
