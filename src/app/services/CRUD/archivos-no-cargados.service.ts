import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root'
})
export class ArchivosNoCargadosService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  async consultarArchivosNoCargados(): Promise<any> {
    const sql = 'SELECT * FROM archivosNoCargados WHERE cargado != 0;';
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  insertarNoCargados(body: { registros: any[] }): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/bulk-insert', body);
  }

  async capturarArchivosNoCargados(archivos: string[]): Promise<{ success: boolean, message: string, updated: number }> {
    if (!archivos || archivos.length === 0) {
      return { success: false, message: 'No se recibieron archivos', updated: 0 };
    }

    try {
      // Primero insertamos los nuevos archivos si no existen
      const insertPromises = archivos.map(nombre => {
        const insertSql = `
          INSERT OR IGNORE INTO archivosNoCargados (nombre, cargado)
          VALUES (?, 0)
        `;
        return this.databaseService.execute(insertSql, [nombre]);
      });

      await Promise.all(insertPromises);

      // Luego actualizamos a cargado = 0 los que ya existían
      const placeholders = archivos.map(() => '?').join(',');
      const updateSql = `
        UPDATE archivosNoCargados 
        SET cargado = 0 
        WHERE nombre IN (${placeholders})
      `;

      const result = await this.databaseService.execute(updateSql, archivos);

      return {
        success: true,
        message: `${archivos.length} archivos procesados (${result.rowsAffected} actualizados)`,
        updated: result.rowsAffected
      };

    } catch (error: any) {
      console.error('Error al procesar archivos:', error);
      return {
        success: false,
        message: 'Error al procesar archivos: ' + error.message,
        updated: 0
      };
    }
  }

  async marcarArchivosNoCargados(archivos: { id: number, nombre: string }[]): Promise<void> {
    for (const { id } of archivos) {
      const sql = `
            UPDATE archivosNoCargados 
            SET cargado = 1 
            WHERE id = ?
        `;
      const params = [id];

      await this.databaseService.execute(sql, params);
    }
  }
}
