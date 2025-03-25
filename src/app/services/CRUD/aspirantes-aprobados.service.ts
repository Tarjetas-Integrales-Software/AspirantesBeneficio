import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { CurpsRegistradasService } from './curps-registradas.service';

export interface Aspirante_Aprobado {
  id: number;
  id_modalidad: number;
  id_foto?: string;
  curp: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
  fecha_nacimiento: string;
  grado: string;
  tipo_carrera: string;
  carrera: string;
  estado: string;
  municipio: string;
  ciudad: string;
  cp: string;
  colonia: string;
  tipo_asentamiento?: string;
  modulo?: string;
  tipo_zona: string;
  domicilio: string;
  com_obs?: string;
  fecha_evento: string;
  created_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AspirantesAprobadosService {

  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getAspirantesAprobadosAll(body: any): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/aspirantes_beneficio_aprobados_all', { ...body });
  }
}
