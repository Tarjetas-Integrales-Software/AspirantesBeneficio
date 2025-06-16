import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    return this.http.get(environment.apiUrl + '/lic/aspben/cajerosfotos_all');
  }

  getFotosUsuario(idUsuario: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajerosfotos_por_id', { id_user: idUsuario });
  }

  createFoto(foto: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajerosfotos/register', { ...foto });
  }

  editFoto(foto: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajerosfotos/edit', { ...foto });
  }

  deleteFoto(foto: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/cajerosfotos/delete', { ...foto });
  }

  async registerPhoto(asistencia: any, foto: any) {

    console.log(asistencia, foto);
    

    // Leer la imagen desde el main process
    const { id } = asistencia;
    const { archivo, tipo, fecha } = foto;

    const imageData = await this.getImageFromMainProcess(archivo.slice(0, -5), 'imagenesAsistencia');

    // Crear el FormData
    const formData = new FormData();
    formData.append('fecha', fecha.substring(0, 19));
    formData.append('tipo', tipo);
    formData.append('nombre_foto', archivo.slice(0, -5));
    formData.append('id_asistencia', id);

    // Convertir el buffer a un archivo Blob
    const blob = new Blob([imageData], { type: 'image/webp' });
    formData.append('file', blob, archivo);

    // Enviar la petición POST
    return this.http.post(environment.apiUrl + '/lic/aspben/registrar-cajerosfotos', formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    }).toPromise();
  }

  private getImageFromMainProcess(imageName: string, path: string): Promise<ArrayBuffer> {
    if (!window.electronAPI) {
      return Promise.reject('Electron API no disponible (ejecutando en navegador)');
    }

    return window.electronAPI.getImage(imageName, path);
  }

  // REMOTOS FIN

  // LOCALES INICIO

  async consultarFotoPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM cajeros_fotos WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

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
