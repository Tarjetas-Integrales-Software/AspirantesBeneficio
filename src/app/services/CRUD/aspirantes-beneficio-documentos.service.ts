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
  crearRelacionLocal(relacion: {
    id_aspirante_beneficio: number;
    id_documento: number;
    id_status: number;
    created_id: number;
    created_at: string;
  }): Observable<any> {
    return new Observable(observer => {
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

      this.databaseService.execute(sql, params).then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => observer.error(error));
    });
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

  // Rollback por claves compuestas (Observable)
  rollbackRelacionDocumento(id_aspirante_beneficio: number, id_documento: number): Observable<void> {
    return new Observable<void>(observer => {
      const sql = 'DELETE FROM sy_aspirantes_beneficio_documentos WHERE id_aspirante_beneficio = ? AND id_documento = ?';
      this.databaseService.execute(sql, [id_aspirante_beneficio, id_documento])
        .then(() => {
          console.log(`Rollback: Relación aspirante-documento (${id_aspirante_beneficio}, ${id_documento}) eliminada exitosamente`);
          observer.next();
          observer.complete();
        })
        .catch(error => {
          console.error(`Error en rollback de relación aspirante-documento (${id_aspirante_beneficio}, ${id_documento}):`, error);
          observer.error(error);
        });
    });
  }

}
