import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

export interface CurpAprobadaSsas {
  id: number;
  curp: string;
  nombre?: string;
  paterno?: string;
  materno?: string;
  modulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  created_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurpsAprobadasSsasService {

  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService) { }

  createCurpAprobadaSsas(curpAprobadaSsas: any): Observable<any> {
      return this.http.post(environment.apiUrl + '/lic/aspben/curps_aprobadas/importar_excel', { ...curpAprobadaSsas });
    }
}
