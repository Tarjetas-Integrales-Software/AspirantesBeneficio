import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '../database.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const { ipcRenderer } = (window as any).require("electron");

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  createDocumento(documento: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/documentos/register', { ...documento });
  }

  // Crear un nuevo documento
  async crearDocumento(documento: {
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
      INSERT OR REPLACE INTO ct_documentos (
        id_status, fecha, tipo, archivo, path, archivoOriginal, extension, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      documento.id_status,
      documento.fecha,
      documento.tipo,
      documento.archivo,
      documento.path,
      documento.archivoOriginal,
      documento.extension,
      documento.created_id,
      documento.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Leer una foto por ID
  async consultarDocumentoPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM ct_documentos WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  async getLastId(): Promise<number | null> {
    try {
      // Consulta SQL para obtener el último id
      const sql = `SELECT MAX(id) AS id FROM ct_documentos`;

      // Usar query en lugar de execute
      const result = await this.databaseService.query(sql);

      // Extraer el id si existe, si no, devolver null
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error al obtener el último id:', error);
      throw error; // Relanzar el error para manejarlo en el llamador
    }
  }

  async registerDocumento(aspirante: any, documento: any) {
    // Leer el documento desde el main process
    const { archivo, fecha, tipo } = documento;
    const { id, curp } = aspirante;

    try {
        // Leer el archivo PDF desde el proceso principal
        const fileData = await this.getFileFromMainProcess(curp);

        // Crear el FormData
        const formData = new FormData();
        formData.append('fecha', fecha);
        formData.append('tipo', tipo);
        formData.append('curp', curp);
        formData.append('id_aspirante_beneficio', id.toString());

        // Convertir el buffer a un archivo Blob con el tipo correcto
        const blob = new Blob([fileData], { type: 'application/pdf' });
        formData.append('file', blob, archivo);

        // Enviar la petición POST al backend
        return await this.http.post(environment.apiUrl + '/lic/aspben/registrar-documentos', formData, {
            headers: new HttpHeaders({
                'Accept': 'application/json'
            })
        }).toPromise();
    } catch (error) {
        console.error("Error al registrar el documento:", error);
        throw error;
    }
}

  private getFileFromMainProcess(fileName: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('get-pdf', fileName);
      ipcRenderer.once('pdf-read-success', (event: any, data: any) => {
        resolve(data);
      });
      ipcRenderer.once('pdf-read-error', (event: any, err: any) => {
        reject(err);
      });
    });
  }

  deleteDocumento(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/documentos/delete', { id: id });
  }

}
