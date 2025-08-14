import { Injectable } from '@angular/core';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})

export class ConfiguracionService {
  private intervalos: {
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
    nombre: 'syncDocumentosInterval', intervalo: 3, activo: 1
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
    nombre: 'syncCargarArchivosPendientesInterval', intervalo: 5, activo: 1
  }];

  constructor(private databaseService: DatabaseService) { }

  async consultar(): Promise<{
    nombre: string;
    intervalo: number;
    activo: number;
  }[]> {
    const sql = 'SELECT * FROM configuracion;';
    const resultados: {
      nombre: string;
      intervalo: number;
      activo: number;
    }[] = await this.databaseService.query(sql);

    if (resultados.length === 0) {
      this.llenarTabla(this.intervalos)

      return this.intervalos;
    }

    return resultados;
  }

  async consultarPorNombre(nombre: string): Promise<any> {
    const sql = 'SELECT * FROM configuracion WHERE nombre = ?;';
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
      INSERT OR REPLACE INTO configuracion (
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

  async actualizarPorNombre(datos: {
    nombre: string
    intervalo: number;
    activo: number;
  }): Promise<any> {
    const sql = `
      UPDATE configuracion
      SET intervalo = ?, activo = ?
      WHERE nombre = ?;
    `;
    const params = [
      datos.intervalo,
      datos.activo,
      datos.nombre
    ];

    return await this.databaseService.execute(sql, params);
  }

  async llenarTabla(intervalos: {
    nombre: string;
    intervalo: number;
    activo: number;
  }[]) {
    intervalos.map(intervalo => this.crear(intervalo))
  }
}
