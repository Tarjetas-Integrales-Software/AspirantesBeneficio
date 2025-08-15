import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root',
})
export class FotosService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  // Crear una nueva foto (Observable)
  crearFotoLocal(foto: {
    id_status: number;
    fecha: string;
    tipo: string;
    archivo: string;
    path: string;
    archivoOriginal: string;
    extension: string;
    created_id: number;
    created_at: string;
  }): Observable<any> {
    return new Observable(observer => {
      const sql = `
        INSERT OR REPLACE INTO ct_fotos (
          id_status, fecha, tipo, archivo, path, archivoOriginal, extension, created_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      const params = [
        foto.id_status, foto.fecha, foto.tipo, foto.archivo, foto.path,
        foto.archivoOriginal, foto.extension, foto.created_id, foto.created_at,
      ];
      this.databaseService.execute(sql, params)
        .then(res => { observer.next(res); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  createFoto(foto: Object): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/fotos/register', { ...foto });
  }

  // Reemplazar métodos async por observables
  consultarFotos(): Observable<any[]> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM ct_fotos ORDER BY created_at DESC;';
      this.databaseService.query(sql)
        .then(rows => { observer.next(rows); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  consultarFotoPorId(id: number): Observable<any> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM ct_fotos WHERE id = ?;';
      this.databaseService.query(sql, [id])
        .then(rows => { observer.next(rows.length > 0 ? rows[0] : null); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  actualizarFoto(id: number, foto: { id_status?: number; fecha?: string; tipo?: string; archivo?: string; path?: string; archivoOriginal?: string; extension?: string; updated_id?: number; updated_at?: string; }): Observable<any> {
    return new Observable(observer => {
      const campos: string[] = []; const params: any[] = [];
      const push = (campo: string, valor: any) => { campos.push(campo + ' = ?'); params.push(valor); };
      if (foto.id_status !== undefined) push('id_status', foto.id_status);
      if (foto.fecha !== undefined) push('fecha', foto.fecha);
      if (foto.tipo !== undefined) push('tipo', foto.tipo);
      if (foto.archivo !== undefined) push('archivo', foto.archivo);
      if (foto.path !== undefined) push('path', foto.path);
      if (foto.archivoOriginal !== undefined) push('archivoOriginal', foto.archivoOriginal);
      if (foto.extension !== undefined) push('extension', foto.extension);
      if (foto.updated_id !== undefined) push('updated_id', foto.updated_id);
      if (foto.updated_at !== undefined) push('updated_at', foto.updated_at);
      if (!campos.length) { observer.error('No se proporcionaron campos para actualizar.'); return; }
      const sql = `UPDATE ct_fotos SET ${campos.join(', ')} WHERE id = ?;`;
      params.push(id);
      this.databaseService.execute(sql, params)
        .then(res => { observer.next(res); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  deleteFoto(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/fotos/delete', { id: id });
  }

  // Eliminar una foto (soft delete)
  async eliminarFoto(id: number): Promise<any> {
    const sql = `DELETE FROM ct_fotos WHERE id = ?;`;
    const params = [id];
    return await this.databaseService.execute(sql, params);
  }

  getLastIdObservable(): Observable<number> { // única versión
    return new Observable(observer => {
      const sql = `SELECT id FROM ct_fotos ORDER BY id DESC LIMIT 1`;
      this.databaseService.query(sql)
        .then(result => { observer.next(result.length ? result[0].id : 0); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  getAspiranteFotoId(id: string): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/obtener-ruta-foto', { id_foto_aspben: id });
  }

  registerPhoto(aspirante: any, foto: any): Observable<any> {
    return new Observable(observer => {
      const { archivo, fecha, tipo } = foto;
      const { id, curp } = aspirante;
      this.getImageFromMainProcess(curp, 'imagenesBeneficiarios').subscribe({
        next: (imageData) => {
          const formData = new FormData();
          formData.append('fecha', fecha);
          formData.append('tipo', tipo);
          formData.append('curp', curp);
            formData.append('id_aspirante_beneficio', id.toString());
          const blob = new Blob([imageData], { type: 'image/webp' });
          formData.append('file', blob, archivo);
          this.http.post(environment.apiUrl + '/lic/aspben/registrar-foto', formData, { headers: new HttpHeaders({ 'Accept': 'application/json' }) })
            .subscribe({ next: r => { observer.next(r); observer.complete(); }, error: e => observer.error(e) });
        },
        error: e => observer.error(e)
      });
    });
  }

  private getImageFromMainProcess(imageName: string, path: string): Observable<ArrayBuffer> {
    return new Observable(observer => {
      if (!window.electronAPI) { observer.error('Electron API no disponible'); return; }
      window.electronAPI.getImage(imageName, path)
        .then((data: ArrayBuffer) => { observer.next(data); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  rollbackFoto(id: number): Observable<void> {
    return new Observable<void>(observer => {
      const sql = 'DELETE FROM ct_fotos WHERE id = ?';
      this.databaseService.execute(sql, [id])
        .then(() => { observer.next(); observer.complete(); })
        .catch(err => { console.error(`Error rollback foto ${id}:`, err); observer.error(err); });
    });
  }
}
