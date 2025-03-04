import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root',
})
export class AspirantesBeneficioService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getAspirantesBeneficio(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/aspirantes_beneficio_all');
  }

  getAspirantesBeneficioId(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_beneficio_por_id', { id: id });
  }

  deleteAspiranteBeneficio(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_beneficio/delete', { id: id });
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO ct_aspirantes_beneficio (
          id, id_modalidad, curp, nombre_completo, telefono, email, fecha_nacimiento,
          estado, municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona,
          domicilio, com_obs, fecha_evento, created_id, updated_id, deleted_id,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.id_modalidad,
        item.curp,
        item.nombre_completo,
        item.telefono,
        item.email,
        item.fecha_nacimiento,
        item.estado,
        item.municipio,
        item.ciudad,
        item.cp,
        item.colonia,
        item.tipo_asentamiento,
        item.tipo_zona,
        item.domicilio,
        item.com_obs,
        item.fecha_evento,
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

  // Crear un nuevo aspirante
  async crearAspirante(aspirante: {
    id: number;
    id_modalidad: number;
    curp: string;
    nombre_completo: string;
    telefono: string;
    email?: string;
    fecha_nacimiento: string;
    estado: string;
    municipio: string;
    ciudad: string;
    cp: string;
    colonia: string;
    tipo_asentamiento?: string;
    tipo_zona: string;
    domicilio: string;
    com_obs?: string;
    fecha_evento: string;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO ct_aspirantes_beneficio (
        id, id_modalidad, curp, nombre_completo, telefono, email, fecha_nacimiento, estado,
        municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona, domicilio, com_obs,
        fecha_evento, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      aspirante.id,
      aspirante.id_modalidad,
      aspirante.curp,
      aspirante.nombre_completo,
      aspirante.telefono,
      aspirante.email,
      aspirante.fecha_nacimiento,
      aspirante.estado,
      aspirante.municipio,
      aspirante.ciudad,
      aspirante.cp,
      aspirante.colonia,
      aspirante.tipo_asentamiento,
      aspirante.tipo_zona,
      aspirante.domicilio,
      aspirante.com_obs,
      aspirante.fecha_evento,
      aspirante.created_id,
      aspirante.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Leer todos los aspirantes
  async consultarAspirantes(): Promise<any[]> {
    const sql = 'SELECT * FROM ct_aspirantes_beneficio ORDER BY fecha_evento DESC;';
    return await this.databaseService.query(sql);
  }

  // Leer un aspirante por ID
  async consultarAspirantePorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM ct_aspirantes_beneficio WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  async getLastId(): Promise<number | null> {
    try {
      // Consulta SQL para obtener el último id
      const sql = `SELECT id FROM ct_aspirantes_beneficio ORDER BY id DESC LIMIT 1`;

      // Usar query en lugar de execute
      const result = await this.databaseService.query(sql);

      // Extraer el id si existe, si no, devolver null
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error al obtener el último id:', error);
      throw error; // Relanzar el error para manejarlo en el llamador
    }
  }
}
