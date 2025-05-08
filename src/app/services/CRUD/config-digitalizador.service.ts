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

  constructor(private databaseService: DatabaseService) {}

  async CreateConfigInicialDigitalizador() {
    //let config = await this.consultarConfigDigitalizador();
    //console.log(config,'config_1');

    //if (!config) {
      let config = {
        ruta_digitalizados: 'C:\\ExpedientesBeneficiarios\\Digitalizados',
        ruta_enviados: 'C:\\ExpedientesBeneficiarios\\Enviados',
        tiempo_sync: 10
      };
      await this.localCreateOrUpdate_ConfigDigitalizador(config);
    //}
    console.log('getOrCreateConfig');
    console.log(config,'config');
    return config;

  }

  async consultarConfigDigitalizador(): Promise<{
    ruta_digitalizados: string;
    ruta_enviados: string;
    tiempo_sync: number;
  } > {
    const defaultConfig = {
      ruta_digitalizados: '',
      ruta_enviados: '',
      tiempo_sync: 10
    };

    try{
      const sql = `SELECT * FROM sy_config_digitalizador WHERE id = 1;`;
      const result = await this.databaseService.execute(sql);

      // if (!result || !result.rows || result.rows.length === 0) {
      //   return defaultConfig;
      // }

      const config = result.rows.item(1);
      return {
        ruta_digitalizados: config.ruta_digitalizados || defaultConfig.ruta_digitalizados,
        ruta_enviados: config.ruta_enviados || defaultConfig.ruta_enviados,
        tiempo_sync: config.tiempo_sync || defaultConfig.tiempo_sync
      };
    }catch (error) {
      console.error('Error al consultar configuración:', error);
      return defaultConfig;
    }
  }

  async localCreateOrUpdate_ConfigDigitalizador(config: {
    ruta_digitalizados: string;
    ruta_enviados: string;
    tiempo_sync: number;
  }): Promise<any> {
    // Primero verifica si existe el registro
    const checkSql = `SELECT 1 FROM sy_config_digitalizador WHERE id = 1;`;
    const exists = await this.databaseService.execute(checkSql);

      // Actualiza el registro existente
      const updateSql = `
        UPDATE sy_config_digitalizador
        SET ruta_digitalizados = ?,
            ruta_enviados = ?,
            tiempo_sync = ?
        WHERE id = 1;
      `;
      const params = [
        config.ruta_digitalizados,
        config.ruta_enviados,
        config.tiempo_sync
      ];
      return await this.databaseService.execute(updateSql, params);
  }


  // TIPOS DOCUMENTOS - DIGITALIZADOR PARA ASPBEN

  getTiposDocsDigitalizador(): Observable<any> {
    return new Observable(observer => {
      this.networkStatusService.isOnline.subscribe(online => {
        if (online) {
          this.http.get(environment.apiUrl + '/lic/aspben/tipos_docs_dig_activos').subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          const sql = 'SELECT * FROM ct_tipos_documentos_digitalizador WHERE deleted_at IS NULL';
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

  async syncLocalDataBase_TiposDocsDigitalizador(datos: any[]): Promise<void> {
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

  async consultarTiposDocsDigitalizador(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT id, tipo_doc_dig
      FROM ct_tipos_documentos_digitalizador
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
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

  async consultarContenedores(): Promise<{ id: number; modalidad: string }[]> {
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
}
