import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { NetworkStatusService } from '../network-status.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigDigitalizadorService {

  private http = inject(HttpClient);
  private networkStatusService = inject(NetworkStatusService);

  constructor(private databaseService: DatabaseService) { }

  async consultarConfigDigitalizador(): Promise<any> {
    try {
      const sql = `SELECT * FROM sy_config_digitalizador WHERE id = 1;`;
      const result = await this.databaseService.query(sql);

      return result[0];
    } catch (error) {
      console.error('Error al consultar configuración:', error);
      throw error; // Opcional: Relanza el error para manejarlo fuera
    }
  }

  async localCreateOrUpdate_ConfigDigitalizador(config: {
    ruta_digitalizados: string;
    ruta_enviados: string;
    tiempo_sync: number;
    extension: string;
    peso_minimo: number;
    tipo: string;
    regexCurp: string;
    regexFecha: string;
    qr: number;
    barras: number;
  }): Promise<any> {
    const insertSql = `
    INSERT OR REPLACE INTO sy_config_digitalizador (
      id,
      ruta_digitalizados,
      ruta_enviados,
      tiempo_sync,
      extension,
      peso_minimo,
      tipo,
      regex_curp,
      regex_fecha,
      qr,
      barras
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
    const params = [
      1,
      config.ruta_digitalizados,
      config.ruta_enviados,
      config.tiempo_sync,
      config.extension,
      config.peso_minimo,
      config.tipo,
      config.regexCurp,
      config.regexFecha,
      config.qr,
      config.barras,
    ];
    return await this.databaseService.execute(insertSql, params);
  }

  // TIPOS DOCUMENTOS - DIGITALIZADOR PARA ASPBEN

  getTipos(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/tipos_docs_dig_activos');
  }

  async syncTipos(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO ct_tipos_documentos_digitalizador (
          id, tipo_doc_dig,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.tipo_doc_dig,
        item.created_id,
        item.updated_id,
        item.deleted_id,
        item.created_at,
        item.updated_at,
        item.deleted_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async syncGrupos(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO digitalizador_grupos (
          id,
          id_tipo_beneficio,
          id_tipo_documento_digitalizacion,
          nombre_archivo_upload,
          fecha_expediente,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.id_tipo_beneficio,
        item.id_tipo_documento_digitalizacion,
        item.nombre_archivo_upload,
        item.fecha_expediente,
        item.created_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarTipos(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT id, tipo_doc_dig
      FROM ct_tipos_documentos_digitalizador
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;

    // Ejecutar la consulta
    return this.databaseService.query(sql);
  }

  // CONTENEDORES - DIGITALIZADOR PARA ASPBEN

  getContenedores(): Observable<any> {
    return new Observable(observer => {
      this.networkStatusService.isOnline.subscribe(online => {
        if (online) {
          this.http.get(environment.apiUrl + '/lic/aspben/contenedores_activos').subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          const sql = 'SELECT * FROM ct_contenedores WHERE deleted_at IS NULL';
          const params: any[] = [];

          this.databaseService.query(sql, params).then(resultados => {
            observer.next({ data: resultados });
            observer.complete();
          }).catch(error => {
            observer.error(error);
          });
        }
      });
    });
  }

  async syncLocalDataBase_Contenedores(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO ct_contenedores (
          id, nombre, descripcion_contenedor, descripcion_ubicacion,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.nombre,
        item.descripcion_contenedor,
        item.descripcion_ubicacion,
        item.created_id,
        item.updated_id,
        item.deleted_id,
        item.created_at,
        item.updated_at,
        item.deleted_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarContenedores(): Promise<{ id: number; nombre: string }[]> {
    const sql = `
      SELECT id, nombre, descripcion_contenedor, descripcion_ubicacion
      FROM ct_contenedores
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  // EXTENSIONES DE ARCHIVOS A DIGITALIZAR - DIGITALIZADOR PARA ASPBEN

  getExtensiones(): Observable<any> {
    return new Observable(observer => {
      this.networkStatusService.isOnline.subscribe(online => {
        if (online) {
          this.http.get(environment.apiUrl + '/lic/aspben/extensiones_activos').subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          const sql = 'SELECT * FROM ct_extensiones WHERE deleted_at IS NULL';
          const params: any[] = [];

          this.databaseService.query(sql, params).then(resultados => {
            observer.next({ data: resultados });
            observer.complete();
          }).catch(error => {
            observer.error(error);
          });
        }
      });
    });
  }

  async syncLocalDataBase_Extensiones(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO ct_extensiones (
          id, nombre,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.nombre,
        item.created_id,
        item.updated_id,
        item.deleted_id,
        item.created_at,
        item.updated_at,
        item.deleted_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarExtensiones(): Promise<{ id: number; nombre: string }[]> {
    const sql = `
      SELECT id, nombre
      FROM ct_extensiones
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  // ARCHIVOS UPLOAD CON NOMBRES ESPERADOS A DIGITALIZAR - DIGITALIZADOR PARA ASPBEN

  getNombresArchivosUploadDigitalizador(): Observable<any> {
    return new Observable(observer => {
      this.networkStatusService.isOnline.subscribe(online => {
        if (online) {
          this.http.get(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion_activos_distinct_nombre_archivo_upload').subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          const sql = 'SELECT * FROM ct_nombres_archivos_upload WHERE deleted_at IS NULL';
          const params: any[] = [];

          this.databaseService.query(sql, params).then(resultados => {
            observer.next({ data: resultados });
            observer.complete();
          }).catch(error => {
            observer.error(error);
          });
        }
      });
    });
  }

  async syncLocalDataBase_NombresArchivosUpload(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR IGNORE INTO ct_nombres_archivos_upload (
          id, nombre,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
        item.nombre_archivo_upload,
        item.created_id,
        item.updated_id,
        item.deleted_id,
        item.created_at,
        item.updated_at,
        item.deleted_at,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarGrupos(body: {
    id_tipo_documento_digitalizacion: string,
    id_tipo_beneficio: string,
    fecha: string,  // Formato: 'YYYY-MM-DD'
  }): Promise<{ id: number; nombre_archivo_upload: string }[]> {
    const sql = `
    SELECT
      MIN(id) as id,
      nombre_archivo_upload
    FROM digitalizador_grupos
    WHERE id_tipo_documento_digitalizacion = ?
      AND id_tipo_beneficio = ?
      AND fecha_expediente = ?
    GROUP BY nombre_archivo_upload  -- Agrupa por nombre (elimina duplicados)
    ORDER BY id;
  `;

    const params = [
      body.id_tipo_documento_digitalizacion.toString(),
      body.id_tipo_beneficio.toString(),
      body.fecha,
    ];

    return await this.databaseService.query(sql, params);
  }
}
