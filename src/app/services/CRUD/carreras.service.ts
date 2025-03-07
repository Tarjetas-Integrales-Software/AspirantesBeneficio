import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class CarrerasService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getCarreras(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/carreras_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR IGNORE INTO cat_cs_carreras (
          id, id_grado, id_tipo, nombre, descripcion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;
      const params = [
        item.id,
        item.id_grado,
        item.id_tipo,
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

  async consultarCarreras(): Promise<{ id: number; nombre: string }[]> {
    const sql = `
      SELECT id, nombre FROM cat_cs_carreras ORDER BY nombre;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  async consultarCarrerasPorIdGrado(id_grado?: string,id_tipo?: string): Promise<{ id: number; nombre: string;  }[]> {
    let sql = `
     SELECT id, nombre FROM cat_cs_carreras
    `;

    // Agregar filtro por id_grado si se proporciona

    sql += ' WHERE 1 = 1 ';


    // Agregar filtro por id_grado si se proporciona
    if (id_grado) {
      sql += ' AND id_grado = ? ';
    }

    // Agregar filtro por id_tipo si se proporciona
    if (id_tipo) {
      sql += ' AND id_tipo = ? ';
    }

    sql += ') ORDER BY nombre; ';

    let _id_grado = id_grado ? [id_grado] : ''
    let _id_tipo = id_tipo ? [id_tipo] : ''

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, [_id_grado,_id_tipo]);
    return resultados;
  }

  async consultarTiposCarrerasPorTipoCarrera(id_tipo?: string): Promise<{ id: number; colonia: string; tipo_zona: string; tipo_asentamiento: string }[]> {
    let sql = `
      SELECT id, nombre FROM cat_cs_carreras
    `;

    // Agregar filtro por id_grado si se proporciona
    if (id_tipo) {
      sql += ' WHERE id_tipo = ?';
    }

    sql += ') ORDER BY id;';

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, id_tipo ? [id_tipo] : []);
    return resultados;
  }



}
