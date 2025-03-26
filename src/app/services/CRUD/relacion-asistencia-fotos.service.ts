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
    return this.http.get(environment.apiUrl + '/lic/aspben/asistencia_all');
  }

  getRelacionesUsuario(idUsuario: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia_por_id_user', { id_user: idUsuario });
  }

  createRelacion(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/register', { ...asistencia });
  }

  editRelacion(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/edit', { ...asistencia });
  }

  deleteRelacion(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/delete', { ...asistencia });
  }

  // REMOTOS FIN

  // LOCALES INICIO

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

  // LOCALES FIN
}
