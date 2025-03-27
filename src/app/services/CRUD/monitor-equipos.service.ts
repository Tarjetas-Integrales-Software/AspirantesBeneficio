import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

export interface cs_monitor_equipos {
  numero_serial?: string;
  version_instalada?: string;
  app_en_ejecucion?: string;
  usuario_ejecutando_app?: string;
  lat?: string;
  lng?: string;
  fecha_evento?: string;
  created_id?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MonitorEquiposService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {}

  registrarMonitorEquipo(monitor_equipo: cs_monitor_equipos): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/monitor_equipos/register', { ...monitor_equipo });
  }

  editMonitorEquipo(monitor_equipo: cs_monitor_equipos): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/monitor_equipos/edit', { ...monitor_equipo });
  }

  registerOrEditMonitorEquipo(monitor_equipo: cs_monitor_equipos): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/monitor_equipos/register_edit', { ...monitor_equipo });
  }


  async insertOrUpdate_MonitorEquipo(
    numero_serial: string, version_instalada: string,
    app_en_ejecucion: number, usuario_ejecutando_app: string,
    lat: string, lng: string

  ): Promise<void> {

    const sql = `
     INSERT OR REPLACE INTO cs_monitor_equipos (
      numero_serial, version_instalada
      , app_en_ejecucion, usuario_ejecutando_app
      , lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      1,
      numero_serial,
      version_instalada,
      app_en_ejecucion,
      usuario_ejecutando_app,
      lat,
      lng
    ];

    await this.databaseService.execute(sql, params);
  }

  async updateValorPorColumna(columna: string, valor: string): Promise<void> {
    /*
        COLUMNAS:
        numero_serial
        version_instalada
        app_en_ejecucion
        usuario_ejecutando_app
        lat
        lng
    */
    const sql = `UPDATE cs_monitor_equipos SET ${columna} = ?;`;
    await this.databaseService.execute(sql, [valor]);
    console.log(`Actualización en SQLite: ${columna} = ${valor}`);
  }

}
