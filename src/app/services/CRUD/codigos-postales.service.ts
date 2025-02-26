import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class CodigosPostalesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {

  }

  getGeneros(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/codposcol_all');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT INTO CS_CodigosPostales_Colonias (
          id, estado, municipio, ciudad, cp, colonia, tipo_asentamiento, tipo_zona, 
          created_id, updated_id, deleted_id, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item.id,
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
}
