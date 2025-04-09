import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';
import { firstValueFrom } from 'rxjs';

export interface cs_monitor_ejecucion_acciones {
  numero_serial?: string;
  usuario_ejecutando_app?: string;
  tipo_accion?: string;
  fecha_evento?: string;
  created_id?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccionesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }


  // getCurpsReenviarActivos(): Observable<any> {
  //   return this.http.get(environment.apiUrl + '/lic/aspben/curps_reenviar_activos');
  // }

  async getCurpsReenviarActivos(): Promise<any> {
    return await firstValueFrom(
      this.http.get(environment.apiUrl + '/lic/aspben/curps_reenviar_activos')
    );
  }

  updateCurpEncontrada(curp: String): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/curps_reenviar/edit/encontrada', { curp: curp, encontrada: 1 });
  }

  registrarMonitorEjecucionAcciones(monitor_ejecucion_acciones: cs_monitor_ejecucion_acciones): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/monitor_ejecuion_acciones/register', { ...monitor_ejecucion_acciones });
  }


}
