import { Injectable } from '@angular/core';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  constructor(private databaseService: DatabaseService) { }

  async consultarPorNombre(nombre: string): Promise<any> {
    const sql = 'SELECT * FROM configuraciones WHERE nombre = ?;';
    const params = [nombre];
    const resultados = await this.databaseService.query(sql, params);

    return resultados;
  }

  async crear(intervalo: {
    nombre: string;
    intervalo: number;
    activo: number;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO configuraciones (
        nombre, intervalo, activo
      ) VALUES (?, ?, ?);
    `;
    const params = [
      intervalo.nombre,
      intervalo.intervalo,
      intervalo.activo,
    ];

    return await this.databaseService.execute(sql, params);
  }

  async actualizarPorNombre(nombre: string, datos: {
    intervalo: number;
    activo: number;
  }): Promise<any> {
    const sql = `
      UPDATE configuraciones
      SET intervalo = ?, activo = ?
      WHERE nombre = ?;
    `;
    const params = [
      datos.intervalo,
      datos.activo,
      nombre
    ];

    return await this.databaseService.execute(sql, params);
  }

  async llenarTabla() {
    const intervalos: {
      nombre: string;
      intervalo: number;
      activo: number;
    }[] = [{
      nombre: 'syncInterval', intervalo: 60, activo: 1
    },
    {
      nombre: 'syncCurpInterval', intervalo: 30, activo: 1
    },
    {
      nombre: 'syncMonitorInterval', intervalo: 9, activo: 1
    },
    {
      nombre: 'syncAsistenciaInterval', intervalo: 30, activo: 1
    },
    {
      nombre: 'syncArchivosDigitalizadosInterval', intervalo: 2, activo: 1
    },
    {
      nombre: 'syncCargarArchivosPendientes', intervalo: 5, activo: 1
    }]

    intervalos.map(intervalo => this.crear(intervalo))
  }
}
