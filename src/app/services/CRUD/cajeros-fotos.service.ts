import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root'
})
export class CajerosFotosService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  // REMOTOS INICIO

  getFotos(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/asistencia_all');
  }

  getFotosUsuario(idUsuario: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia_por_id_user', { id_user: idUsuario });
  }

  createFoto(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/register', { ...asistencia });
  }

  editFoto(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/edit', { ...asistencia });
  }

  deleteFoto(asistencia: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/asistencia/delete', { ...asistencia });
  }

  // REMOTOS FIN

  // LOCALES INICIO

  async localCreateFoto(foto: {
    id_status: number;
    fecha: string;
    tipo: string;
    archivo: string;
    path: string;
    archivoOriginal: string;
    extension: string;
    created_id?: number;
    created_at?: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO cajeros_fotos (
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

  // LOCALES FIN
}
