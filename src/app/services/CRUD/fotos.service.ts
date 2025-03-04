import { Injectable } from '@angular/core';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root',
})
export class FotosService {
  constructor(private databaseService: DatabaseService) { }

  // Crear una nueva foto
  async crearFoto(foto: {
    id_status: number;
    fecha: string;
    tipo: string;
    archivo: string;
    path: string;
    archivoOriginal: string;
    extension: string;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO ct_fotos (
        id_status, fecha, tipo, archivo, path, archivoOriginal, extension, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      foto.id_status,
      foto.fecha,
      foto.tipo,
      foto.archivo,
      foto.path,
      foto.archivoOriginal,
      foto.extension,
      foto.created_id,
      foto.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Leer todas las fotos
  async obtenerFotos(): Promise<any[]> {
    const sql = 'SELECT * FROM ct_fotos ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  // Leer una foto por ID
  async obtenerFotoPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM ct_fotos WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  // Actualizar una foto
  async actualizarFoto(
    id: number,
    foto: {
      id_status?: number;
      fecha?: string;
      tipo?: string;
      archivo?: string;
      path?: string;
      archivoOriginal?: string;
      extension?: string;
      updated_id?: number;
      updated_at?: string;
    }
  ): Promise<any> {
    const campos = [];
    const params = [];

    if (foto.id_status !== undefined) {
      campos.push('id_status = ?');
      params.push(foto.id_status);
    }
    if (foto.fecha !== undefined) {
      campos.push('fecha = ?');
      params.push(foto.fecha);
    }
    if (foto.tipo !== undefined) {
      campos.push('tipo = ?');
      params.push(foto.tipo);
    }
    if (foto.archivo !== undefined) {
      campos.push('archivo = ?');
      params.push(foto.archivo);
    }
    if (foto.path !== undefined) {
      campos.push('path = ?');
      params.push(foto.path);
    }
    if (foto.archivoOriginal !== undefined) {
      campos.push('archivoOriginal = ?');
      params.push(foto.archivoOriginal);
    }
    if (foto.extension !== undefined) {
      campos.push('extension = ?');
      params.push(foto.extension);
    }
    if (foto.updated_id !== undefined) {
      campos.push('updated_id = ?');
      params.push(foto.updated_id);
    }
    if (foto.updated_at !== undefined) {
      campos.push('updated_at = ?');
      params.push(foto.updated_at);
    }

    if (campos.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar.');
    }

    const sql = `UPDATE ct_fotos SET ${campos.join(', ')} WHERE id = ?;`;
    params.push(id);

    return await this.databaseService.execute(sql, params);
  }

  // Eliminar una foto (soft delete)
  async eliminarFoto(id: number, deleted_id: number, deleted_at: string): Promise<any> {
    const sql = `
      UPDATE ct_fotos
      SET deleted_id = ?, deleted_at = ?
      WHERE id = ?;
    `;
    const params = [deleted_id, deleted_at, id];
    return await this.databaseService.execute(sql, params);
  }

  async getLastId(): Promise<number | null> {
    try {
      // Consulta SQL para obtener el último id
      const sql = `SELECT id FROM ct_fotos ORDER BY id DESC LIMIT 1`;

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
