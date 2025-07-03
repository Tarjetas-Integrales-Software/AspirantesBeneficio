import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class RelacionUsuarioRolesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  getRelaciones(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/usuarios');
  }

  async syncLocalDataBase(datos: any[]): Promise<void> {
    for (const item of datos) {
      const sql = `
        INSERT OR REPLACE INTO relacion_usuario_roles (pkUserPerfil, fkUser, fkRole, deleted_at) VALUES (?, ?, ?, ?)
      `;
      const params = [
        item.pkUserPerfil,
        item.fkUser,
        item.fkRole,
        item.deleted_at
      ];

      await this.databaseService.execute(sql, params);
    }
  }

  async consultarRelaciones(): Promise<{ id: number; modalidad: string }[]> {
    const sql = `
      SELECT pkUserPerfil, fkUser, fkRole
      FROM relacion_usuario_roles
      WHERE deleted_at IS NULL
      ORDER BY fkUser;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql);
    return resultados;
  }

  async consultarRolesPorUsuario(idUsuario: number): Promise<{ pkUserPerfil: number, fkUser: number; fkRole: number }[]> {
    const sql = `
      SELECT pkUserPerfil, fkRole
      FROM relacion_usuario_roles
      WHERE deleted_at IS NULL AND fkUser = ?
      ORDER BY pkUserPerfil;
    `;

    // Ejecutar la consulta
    const resultados = await this.databaseService.query(sql, [idUsuario]);
    return resultados;
  }
}
