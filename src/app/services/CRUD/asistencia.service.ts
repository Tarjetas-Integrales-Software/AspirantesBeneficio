import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  // REMOTOS INICIO

  getHistoricoAsistenciasUser(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/historico/user', { id_user: id });
  }

  getAsistencias(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/asistencia_all');
  }

  getAsistenciasUsuario(idUsuario: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia_por_id_user', { id_user: idUsuario });
  }

  createAsistencia(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/register', { ...asistencia });
  }

  editAsistencia(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/edit', { ...asistencia });
  }

  deleteAsistencia(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/delete', { ...asistencia });
  }

  // REMOTOS FIN

  // LOCALES INICIO

  async consultarAsistenciaPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM cajeros_asistencia WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  async localCreateAsistencia(foto: {
    id_user: number;
    id_tipo: number;
    id_modulo: number;
    fecha_hora: string;
    created_id?: number;
    created_at?: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO cajeros_asistencia (
        id_user, id_tipo, id_modulo, fecha_hora, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?);
    `;
    const params = [
      foto.id_user,
      foto.id_tipo,
      foto.id_modulo,
      foto.fecha_hora,
      foto.created_id,
      foto.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // LOCALES FIN
}
