import { Injectable } from '@angular/core';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root',
})
export class AspirantesBeneficioFotosService {
  constructor(private databaseService: DatabaseService) {}

  // Crear una nueva relación aspirante-beneficio-foto
  async crearRelacion(relacion: {
    id_aspirante_beneficio: number;
    id_foto: number;
    id_status: number;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT INTO sy_aspirantes_beneficio_fotos (
        id_aspirante_beneficio, id_foto, id_status, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?);
    `;
    const params = [
      relacion.id_aspirante_beneficio,
      relacion.id_foto,
      relacion.id_status,
      relacion.created_id,
      relacion.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Leer todas las relaciones
  async obtenerRelaciones(): Promise<any[]> {
    const sql = 'SELECT * FROM sy_aspirantes_beneficio_fotos ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  // Leer una relación por ID
  async obtenerRelacionPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM sy_aspirantes_beneficio_fotos WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  // Actualizar una relación
  async actualizarRelacion(
    id: number,
    relacion: {
      id_aspirante_beneficio?: number;
      id_foto?: number;
      id_status?: number;
      updated_id?: number;
      updated_at?: string;
    }
  ): Promise<any> {
    const campos = [];
    const params = [];

    if (relacion.id_aspirante_beneficio !== undefined) {
      campos.push('id_aspirante_beneficio = ?');
      params.push(relacion.id_aspirante_beneficio);
    }
    if (relacion.id_foto !== undefined) {
      campos.push('id_foto = ?');
      params.push(relacion.id_foto);
    }
    if (relacion.id_status !== undefined) {
      campos.push('id_status = ?');
      params.push(relacion.id_status);
    }
    if (relacion.updated_id !== undefined) {
      campos.push('updated_id = ?');
      params.push(relacion.updated_id);
    }
    if (relacion.updated_at !== undefined) {
      campos.push('updated_at = ?');
      params.push(relacion.updated_at);
    }

    if (campos.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar.');
    }

    const sql = `UPDATE sy_aspirantes_beneficio_fotos SET ${campos.join(', ')} WHERE id = ?;`;
    params.push(id);

    return await this.databaseService.execute(sql, params);
  }

  // Eliminar una relación (soft delete)
  async eliminarRelacion(id: number, deleted_id: number, deleted_at: string): Promise<any> {
    const sql = `
      UPDATE sy_aspirantes_beneficio_fotos 
      SET deleted_id = ?, deleted_at = ? 
      WHERE id = ?;
    `;
    const params = [deleted_id, deleted_at, id];
    return await this.databaseService.execute(sql, params);
  }
}