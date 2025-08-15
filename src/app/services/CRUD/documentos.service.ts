import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '../database.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService) { }

  crearDocumentoLocal(documento: { id_status: number; fecha: string; tipo: string; archivo: string; path: string; archivoOriginal: string; extension: string; created_id: number; created_at: string; }): Observable<any> {
    return new Observable(observer => {
      const sql = `INSERT OR REPLACE INTO ct_documentos ( id_status, fecha, tipo, archivo, path, archivoOriginal, extension, created_id, created_at ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      const params = [ documento.id_status, documento.fecha, documento.tipo, documento.archivo, documento.path, documento.archivoOriginal, documento.extension, documento.created_id, documento.created_at ];
      this.databaseService.execute(sql, params)
        .then(r => { observer.next(r); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  createDocumento(documento: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/documentos/register', { ...documento });
  }

  getLastIdObservable(): Observable<number> {
    return new Observable(observer => {
      const sql = `SELECT MAX(id) AS id FROM ct_documentos`;
      this.databaseService.query(sql)
        .then(rows => { observer.next(rows.length ? rows[0].id : 0); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  getAspiranteDocumentoId(id: string): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/obtener-ruta-documento', { id_documento_aspben: id });
  }

  registerDocumento(aspirante: any, documento: any): Observable<any> {
    return new Observable(observer => {
      const { archivo, fecha, tipo } = documento; const { id, curp } = aspirante;
      this.getFileFromMainProcess(curp + '.pdf').subscribe({
        next: (fileData) => {
          const formData = new FormData();
          formData.append('fecha', fecha); formData.append('tipo', tipo); formData.append('curp', curp); formData.append('id_aspirante_beneficio', id.toString());
          const blob = new Blob([fileData], { type: 'application/pdf' });
          formData.append('file', blob, archivo);
          this.http.post(environment.apiUrl + '/lic/aspben/registrar-documento', formData, { headers: new HttpHeaders({ 'Accept': 'application/json' }) })
            .subscribe({ next: r => { observer.next(r); observer.complete(); }, error: e => observer.error(e) });
        }, error: e => observer.error(e)
      });
    });
  }

  private getFileFromMainProcess(fileName: string): Observable<ArrayBuffer> {
    return new Observable(observer => {
      if (!window.electronAPI) { observer.error('Electron API no disponible'); return; }
      window.electronAPI.getFile(fileName)
        .then((data: ArrayBuffer) => { observer.next(data); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  deleteDocumento(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/documentos/delete', { id: id });
  }

  rollbackDocumento(id: number): Observable<void> {
    return new Observable<void>(observer => {
      const sql = 'DELETE FROM ct_documentos WHERE id = ?';
      this.databaseService.execute(sql, [id])
        .then(() => { observer.next(); observer.complete(); })
        .catch(err => { console.error(`Error rollback documento ${id}:`, err); observer.error(err); });
    });
  }

  consultarDocumentoPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM ct_documentos WHERE id = ?';
    return this.databaseService.query(sql, [id]).then(rows => rows.length ? rows[0] : null);
  }

  consultarDocumentoPorId$(id: number): Observable<any> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM ct_documentos WHERE id = ?';
      this.databaseService.query(sql, [id])
        .then(rows => { observer.next(rows.length ? rows[0] : null); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }
}
