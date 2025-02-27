import { Injectable } from '@angular/core';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root',
})
export class AspirantesBeneficioService {
  constructor(private databaseService: DatabaseService) {}

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
      INSERT INTO ct_aspirantes_beneficio (
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
}