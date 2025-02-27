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

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO ct_aspirantes_beneficio (
          id_modalidad, curp, nombre_completo, telefono, email, fecha_nacimiento,
          estado, municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona,
          domicilio, com_obs, fecha_evento, created_id, updated_id, deleted_id,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
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
        id_modalidad, curp, nombre_completo, telefono, email, fecha_nacimiento, estado,
        municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona, domicilio, com_obs,
        fecha_evento, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
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

  // Actualizar un aspirante
  async actualizarAspirante(
    id: number,
    aspirante: {
      id: number;
      id_modalidad?: number;
      curp?: string;
      nombre_completo?: string;
      telefono?: string;
      email?: string;
      fecha_nacimiento?: string;
      estado?: string;
      municipio?: string;
      ciudad?: string;
      cp?: string;
      colonia?: string;
      tipo_asentamiento?: string;
      tipo_zona?: string;
      domicilio?: string;
      com_obs?: string;
      fecha_evento?: string;
      updated_id?: number;
      updated_at?: string;
    }
  ): Promise<any> {
    const campos = [];
    const params = [];

    if (aspirante.id_modalidad !== undefined) {
      campos.push('id_modalidad = ?');
      params.push(aspirante.id_modalidad);
    }
    if (aspirante.curp !== undefined) {
      campos.push('curp = ?');
      params.push(aspirante.curp);
    }
    if (aspirante.nombre_completo !== undefined) {
      campos.push('nombre_completo = ?');
      params.push(aspirante.nombre_completo);
    }
    if (aspirante.telefono !== undefined) {
      campos.push('telefono = ?');
      params.push(aspirante.telefono);
    }
    if (aspirante.email !== undefined) {
      campos.push('email = ?');
      params.push(aspirante.email);
    }
    if (aspirante.fecha_nacimiento !== undefined) {
      campos.push('fecha_nacimiento = ?');
      params.push(aspirante.fecha_nacimiento);
    }
    if (aspirante.estado !== undefined) {
      campos.push('estado = ?');
      params.push(aspirante.estado);
    }
    if (aspirante.municipio !== undefined) {
      campos.push('municipio = ?');
      params.push(aspirante.municipio);
    }
    if (aspirante.ciudad !== undefined) {
      campos.push('ciudad = ?');
      params.push(aspirante.ciudad);
    }
    if (aspirante.cp !== undefined) {
      campos.push('cp = ?');
      params.push(aspirante.cp);
    }
    if (aspirante.colonia !== undefined) {
      campos.push('colonia = ?');
      params.push(aspirante.colonia);
    }
    if (aspirante.tipo_asentamiento !== undefined) {
      campos.push('tipo_asentamiento = ?');
      params.push(aspirante.tipo_asentamiento);
    }
    if (aspirante.tipo_zona !== undefined) {
      campos.push('tipo_zona = ?');
      params.push(aspirante.tipo_zona);
    }
    if (aspirante.domicilio !== undefined) {
      campos.push('domicilio = ?');
      params.push(aspirante.domicilio);
    }
    if (aspirante.com_obs !== undefined) {
      campos.push('com_obs = ?');
      params.push(aspirante.com_obs);
    }
    if (aspirante.fecha_evento !== undefined) {
      campos.push('fecha_evento = ?');
      params.push(aspirante.fecha_evento);
    }
    if (aspirante.updated_id !== undefined) {
      campos.push('updated_id = ?');
      params.push(aspirante.updated_id);
    }
    if (aspirante.updated_at !== undefined) {
      campos.push('updated_at = ?');
      params.push(aspirante.updated_at);
    }

    if (campos.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar.');
    }

    const sql = `UPDATE ct_aspirantes_beneficio SET ${campos.join(', ')} WHERE id = ?;`;
    params.push(id);

    return await this.databaseService.execute(sql, params);
  }

  // Eliminar un aspirante por ID (soft delete)
  async eliminarAspirante(id: number, deleted_id: number, deleted_at: string): Promise<any> {
    const sql = `
      UPDATE ct_aspirantes_beneficio
      SET deleted_id = ?, deleted_at = ?
      WHERE id = ?;
    `;
    const params = [deleted_id, deleted_at, id];
    return await this.databaseService.execute(sql, params);
  }

  async getLastId(): Promise<number> {
    try {
      // Consulta SQL para obtener el último id
      const sql = `SELECT id FROM ct_aspirantes_beneficio ORDER BY id DESC LIMIT 1`;

      // Ejecutar la consulta
      const result = await this.databaseService.execute(sql);

      // Verificar si se obtuvieron resultados
      if (result.rows.length > 0) {
        // Obtener el id de la primera fila
        const lastId = result.rows[0].id;
        return parseInt(lastId, 10); // Convertir a número entero
      } else {
        // Si no hay registros, devolver 0 o un valor por defecto
        return 0;
      }
    } catch (error) {
      console.error('Error al obtener el último id:', error);
      throw error; // Relanzar el error para manejarlo en el llamador
    }
  }
}
