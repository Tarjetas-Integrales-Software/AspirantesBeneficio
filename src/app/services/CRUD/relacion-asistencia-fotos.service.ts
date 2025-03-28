import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root'
})
export class RelacionAsistenciaFotosService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  // REMOTOS INICIO

  getRelaciones(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/cajeros_fotos_all');
  }

  getRelacionesUsuario(idUsuario: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajeros_fotos_por_id_user', { id_user: idUsuario });
  }

  createRelacion(relacion: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajeros_fotos/register', { ...relacion });
  }

  editRelacion(relacion: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajeros_fotos/edit', { ...relacion });
  }

  deleteRelacion(relacion: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajeros_fotos/delete', { ...relacion });
  }

  // REMOTOS FIN

  // LOCALES INICIO

  async consultarRelacionesDesincronizadas(): Promise<any[]> {
    const sql = 'SELECT * FROM relacion_asistencia_fotos WHERE sincronizado IS NULL ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  async localCreateRelacion(foto: {
    id_asistencia: number;
    id_cajero_foto: number;
    id_status: number;
    created_id?: number;
    created_at?: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO relacion_asistencia_fotos (
        id_asistencia, id_cajero_foto, id_status, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?);
    `;
    const params = [
      foto.id_asistencia,
      foto.id_cajero_foto,
      foto.id_status,
      foto.created_id,
      foto.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Eliminar una relación (soft delete)
  async eliminarRelacion(id: number): Promise<any> {
    const sql = 'UPDATE relacion_asistencia_fotos SET sincronizado = ? WHERE id = ?;';

    const params = [1, id];

    try {
      const result = await this.databaseService.execute(sql, params);
      return result;
    } catch (error) {
      console.error('Error al eliminar la relacion:', error);
      throw new Error('No se pudo eliminar la relacion');
    }
  }

  // LOCALES FIN
}
