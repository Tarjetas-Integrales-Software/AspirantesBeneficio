import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class CodigosPostalesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getCodigosPostales(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/codposcol_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT INTO CS_CodigosPostales_Colonias (
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

  async consultarCodigosPostales(query: { cp?: string, colonia?: string, municipio?: string }): Promise<any[]> {
    const { cp, municipio, colonia } = query;

    // Si se filtra por municipio, seleccionar CP únicos
    if (municipio) {
      let sql = 'SELECT DISTINCT cp FROM CS_CodigosPostales_Colonias WHERE 1=1';
      const params: any[] = [];

      // Filtro por municipio
      sql += ' AND municipio LIKE ?';
      params.push(`%${municipio}%`);

      // Ejecutar la consulta
      return await this.databaseService.query(sql, params);
    }

    // Si no se filtra por municipio, mantener la lógica original
    let sql = 'SELECT * FROM CS_CodigosPostales_Colonias WHERE 1=1';
    const params: any[] = [];

    // Filtros opcionales
    if (cp) {
      sql += ' AND cp = ?';
      params.push(cp);
    }
    if (colonia) {
      sql += ' AND colonia LIKE ?';
      params.push(`%${colonia}%`);
    }

    // Ejecutar la consulta
    return await this.databaseService.query(sql, params);
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

  async obtenerColonias(): Promise<{ id: number; colonia: string; tipo_zona: string; tipo_asentamiento: string }[]> {
    const sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY colonia) AS id, 
        colonia, 
        tipo_zona, 
        tipo_asentamiento 
      FROM 
        (SELECT DISTINCT colonia, tipo_zona, tipo_asentamiento FROM CS_CodigosPostales_Colonias)
      ORDER BY 
        colonia;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }
}
