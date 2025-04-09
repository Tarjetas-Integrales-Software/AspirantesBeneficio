import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root',
})
export class AspirantesBeneficioFotosService {
  private http = inject(HttpClient);
  public syncStatusSignal = signal<boolean | null>(null);

  // Señal computada para la ruta de la imagen
  public syncStatusImage = computed(() => {
    return this.syncStatusSignal() ? './assets/img/sync_ok.png' : './assets/img/sync_warning.png';
  });

  constructor(private databaseService: DatabaseService) { }

  updateSyncStatus(value: boolean): void {
    this.syncStatusSignal.set(value);
  }

  getSyncStatus(): boolean | null {
    return this.syncStatusSignal();
  }

  // Crear una nueva relación aspirante-beneficio-foto
  async crearRelacion(relacion: {
    id_aspirante_beneficio: number;
    id_foto: number;
    id_status: number;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO sy_aspirantes_beneficio_fotos (
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
  async consultarRelaciones(): Promise<any[]> {
    const sql = 'SELECT * FROM sy_aspirantes_beneficio_fotos ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  async consultarRelacionesDesincronizadas(): Promise<any[]> {
    const sql = 'SELECT * FROM sy_aspirantes_beneficio_fotos WHERE confirmado IS NULL ORDER BY created_at DESC;';
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
  async eliminarRelacion(id: number): Promise<any> {
    const sql = 'UPDATE sy_aspirantes_beneficio_fotos SET confirmado = ? WHERE id = ?;';

    const params = [1, id];

    try {
      const result = await this.databaseService.execute(sql, params);
      return result;
    } catch (error) {
      console.error('Error al eliminar la relacion:', error);
      throw new Error('No se pudo eliminar la relacion');
    }
  }

  async getLastId(): Promise<number | null> {
    try {
      // Consulta SQL para obtener el último id
      const sql = `SELECT id FROM sy_aspirantes_beneficio_fotos ORDER BY id DESC LIMIT 1`;

      // Usar query en lugar de execute
      const result = await this.databaseService.query(sql);

      // Extraer el id si existe, si no, devolver null
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error al obtener el último id:', error);
      throw error; // Relanzar el error para manejarlo en el llamador
    }
  }

  createRelacion(relacion: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_fotos/register', { ...relacion });
  }

  editRelacion(relacion: { id_aspirante_beneficio: number; id_foto: number }): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_fotos/edit', { ...relacion });
  }


  // Actualizar una relación
  async actualizarConfirmadoPorIdAspiranteBeneficio(
    id_aspirante_beneficio: number,
  ): Promise<any> {

    if (id_aspirante_beneficio === undefined || id_aspirante_beneficio === null) {
      throw new Error('Se requiere un id_aspirante_beneficio válido.');
    }

    const sql = `UPDATE sy_aspirantes_beneficio_fotos SET confirmado = NULL WHERE id_aspirante_beneficio = ?;`;

    const params = [id_aspirante_beneficio];

    return await this.databaseService.execute(sql, params);
  }

}
