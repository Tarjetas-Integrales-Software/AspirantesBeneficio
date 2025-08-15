import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

export interface CurpPrevioRegisto {
  response: boolean;
  data:     Datum[];
  message:  string;
  status:   number;
}

export interface Datum {
  beneficiado:       string;
  id:                number;
  id_modalidad:      string;
  curp:              string;
  nombre:            string;
  apellido_paterno:  string;
  apellido_materno:  string;
  nombre_completo:   string;
  telefono:          string;
  email:             string;
  fecha_nacimiento:  Date;
  grado:             null;
  tipo_carrera:      null;
  carrera:           null;
  estado:            string;
  municipio:         string;
  ciudad:            string;
  cp:                string;
  colonia:           string;
  tipo_asentamiento: string;
  tipo_zona:         string;
  domicilio:         string;
  com_obs:           string;
  fecha_evento:      Date;
  modulo:            string;
  credencializado:   null;
  impreso:           null;
  printed_id:        null;
  created_id:        string;
  updated_id:        null;
  deleted_id:        null;
  created_at:        Date;
  updated_at:        Date;
  deleted_at:        null;
}


@Injectable({
  providedIn: 'root'
})
export class CurpsRegistradasService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getCurpsRegistradas(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/curps_registradas');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const curp of datos) {
      const sql = `
        INSERT OR IGNORE INTO cat_curps_registradas (
        curp
        ) VALUES (?)
      `;
      const params = [
        curp,
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarCurpsRegistradas(): Promise<any[]> {
    const sql = 'SELECT * FROM cat_curps_registradas;';
    return await this.databaseService.query(sql);
  }

  async existeCurp(curp: string): Promise<boolean> {
    const sql = 'SELECT * FROM cat_curps_registradas WHERE curp = ?;';

    const resultados = await this.databaseService.query(sql, [curp]);

    return resultados.length > 0;
  }

  getAspirantesBeneficioPorCurpPrevioRegistro(curp: string): Observable<CurpPrevioRegisto> {
    return this.http.post<CurpPrevioRegisto>(`${environment.apiUrl}/lic/aspben/aspirantes_beneficio_por_curp_previo_registro/`, { curp });
  }

}
