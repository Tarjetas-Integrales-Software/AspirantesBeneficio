import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../services/database.service';
import { NetworkStatusService } from '../network-status.service';

@Injectable({
  providedIn: 'root'
})
export class CodigosPostalesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService, private networkStatusService: NetworkStatusService) {

  }

  getCodigosPostales(): Observable<any> {
    return new Observable(observer => {
      this.networkStatusService.isOnline.subscribe(online => {
        if (online) {
          this.http.get(environment.apiUrl + '/lic/aspben/codposcol_all').subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          const sql = 'SELECT * FROM CS_CodigosPostales_Colonias';
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

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR IGNORE INTO CS_CodigosPostales_Colonias (
          estado, municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona,
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.estado,
        item.municipio,
        item.ciudad,
        item.cp,
        item.colonia,
        item.tipo_asentamiento,
        item.tipo_zona,
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

  async consultarCodigosPostalesUnicos(): Promise<string[]> {
    const sql = 'SELECT DISTINCT cp FROM CS_CodigosPostales_Colonias ORDER BY cp';
    const resultados = await this.databaseService.query(sql);
    return resultados.map((row: any) => row.cp);
  }

  /**
   * Consulta códigos postales con filtros opcionales usando Observable pattern
   * @param query Objeto con filtros opcionales (cp, colonia, municipio)
   * @returns Observable<any[]> Lista de códigos postales que coinciden con los filtros
   */
  consultarCodigosPostales(query: { cp?: string, colonia?: string, municipio?: string }): Observable<any[]> {
    const { cp, municipio, colonia } = query;

    // Si se filtra por municipio, seleccionar CP únicos con ORDER BY para consistencia
    if (municipio) {
      const sql = 'SELECT DISTINCT cp FROM CS_CodigosPostales_Colonias WHERE municipio LIKE ? ORDER BY cp';
      const params = [`%${municipio}%`];

      return from(this.databaseService.query(sql, params)).pipe(
        map(resultados => resultados),
        catchError(error => {
          console.error('Error al consultar códigos postales por municipio:', error);
          throw error;
        })
      );
    }

    // Construcción dinámica de consulta optimizada
    let sql = 'SELECT DISTINCT cp, colonia, municipio, tipo_asentamiento, tipo_zona FROM CS_CodigosPostales_Colonias';
    const conditions: string[] = [];
    const params: any[] = [];

    // Agregar condiciones de forma más limpia
    if (cp) {
      conditions.push('cp = ?');
      params.push(cp);
    }
    if (colonia) {
      conditions.push('colonia LIKE ?');
      params.push(`%${colonia}%`);
    }

    // Agregar WHERE solo si hay condiciones
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY cp, colonia';

    return from(this.databaseService.query(sql, params)).pipe(
      map(resultados => resultados),
      catchError(error => {
        console.error('Error al consultar códigos postales:', error);
        throw error;
      })
    );
  }

  async consultarMunicipios(): Promise<{ id: number; municipio: string }[]> {
    const sql = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY municipio) AS id,
        municipio
      FROM
        (SELECT DISTINCT municipio FROM CS_CodigosPostales_Colonias)
      ORDER BY
        municipio;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  async consultarColonias(cp?: string): Promise<{ id: number; colonia: string; tipo_zona: string; tipo_asentamiento: string }[]> {
    let sql = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY colonia) AS id,
        colonia,
        tipo_zona,
        tipo_asentamiento
      FROM
        (SELECT DISTINCT colonia, tipo_zona, tipo_asentamiento FROM CS_CodigosPostales_Colonias
    `;

    // Agregar filtro por CP si se proporciona
    if (cp) {
      sql += ' WHERE cp = ?';
    }

    sql += ') ORDER BY colonia;';

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, cp ? [cp] : []);
    return resultados;
  }
}
