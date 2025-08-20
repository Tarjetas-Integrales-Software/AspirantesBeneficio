import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '../database.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AspirantesBeneficioDocumentosService {

  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService) { }

  // Crear una nueva relación aspirante-beneficio-documentos
  async crearRelacion(relacion: {
    id_aspirante_beneficio: number;
    id_documento: number;
    id_status: number;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO sy_aspirantes_beneficio_documentos (
        id_aspirante_beneficio, id_documento, id_status, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?);
    `;
    const params = [
      relacion.id_aspirante_beneficio,
      relacion.id_documento,
      relacion.id_status,
      relacion.created_id,
      relacion.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  async consultarRelacionesDesincronizadas(): Promise<any[]> {
    const sql = 'SELECT * FROM sy_aspirantes_beneficio_documentos WHERE confirmado IS NULL ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  createRelacion(relacion: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_documentos/register', { ...relacion });
  }

  // Eliminar una relación (soft delete)
  async eliminarRelacion(id: number): Promise<any> {
    const sql = 'UPDATE sy_aspirantes_beneficio_documentos SET confirmado = ? WHERE id = ?;';

    const params = [1, id];

    try {
      const result = await this.databaseService.execute(sql, params);
      return result;
    } catch (error) {
      console.error('Error al eliminar la relacion:', error);
      throw new Error('No se pudo eliminar la relacion');
    }
  }

}
