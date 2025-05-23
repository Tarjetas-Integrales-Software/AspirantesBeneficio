import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

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
}
