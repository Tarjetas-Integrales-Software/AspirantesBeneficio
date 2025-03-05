import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { DatabaseService } from './../database.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CryptoService } from '../crypto.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) {}

   getUsers(): Observable<any> {
      return this.http.get(environment.apiUrl + '/aspben/usuarios');
    }

    async syncLocalDataBase(datos: any[]): Promise<void> {
      for (const item of datos) {
        const sql = `
          INSERT OR REPLACE INTO users (
            name, p_surname, m_surname, electoralid, email, password, created_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const params = [
          item.name,
          item.p_surname,
          item.m_surname,
          item.electoralid,
          item.email,
          CryptoService.encrypt(item.electoralid),
          item.created_id,
          item.created_at,
        ];

        await this.databaseService.execute(sql, params);
      }
    }

  // Crear un nuevo usuario
  async crearUsuario(usuario: {
    name: string;
    p_surname: string;
    m_surname: string;
    electoralid: string;
    email: string;
    //password: string;
    created_id: number;
    created_at: string;
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO users (
        name, p_surname, m_surname, electoralid, email, password, created_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      usuario.name,
      usuario.p_surname,
      usuario.m_surname,
      usuario.electoralid,
      usuario.email,
      CryptoService.encrypt(usuario.electoralid),
      usuario.created_id,
      usuario.created_at,
    ];

    return await this.databaseService.execute(sql, params);
  }

  // Leer todos los usuarios
  async obtenerUsuarios(): Promise<any[]> {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC;';
    return await this.databaseService.query(sql);
  }

  // Leer un usuario por ID
  async obtenerUsuarioPorId(id: number): Promise<any> {
    const sql = 'SELECT * FROM users WHERE id = ?;';
    const params = [id];
    const resultados = await this.databaseService.query(sql, params);
    return resultados.length > 0 ? resultados[0] : null;
  }

  // Actualizar un usuario
  async actualizarUsuario(
    id: number,
    usuario: {
      name?: string;
      p_surname?: string;
      m_surname?: string;
      electoralid?: string;
      email?: string;
      password?: string;
      updated_id?: number;
      updated_at?: string;
    }
  ): Promise<any> {
    const campos = [];
    const params = [];

    if (usuario.name !== undefined) {
      campos.push('name = ?');
      params.push(usuario.name);
    }
    if (usuario.p_surname !== undefined) {
      campos.push('p_surname = ?');
      params.push(usuario.p_surname);
    }
    if (usuario.m_surname !== undefined) {
      campos.push('m_surname = ?');
      params.push(usuario.m_surname);
    }
    if (usuario.electoralid !== undefined) {
      campos.push('electoralid = ?');
      params.push(usuario.electoralid);
    }
    if (usuario.email !== undefined) {
      campos.push('email = ?');
      params.push(usuario.email);
    }
    if (usuario.password !== undefined) {
      campos.push('password = ?');
      params.push(usuario.password);
    }
    if (usuario.updated_id !== undefined) {
      campos.push('updated_id = ?');
      params.push(usuario.updated_id);
    }
    if (usuario.updated_at !== undefined) {
      campos.push('updated_at = ?');
      params.push(usuario.updated_at);
    }

    if (campos.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar.');
    }

    const sql = `UPDATE users SET ${campos.join(', ')} WHERE id = ?;`;
    params.push(id);

    return await this.databaseService.execute(sql, params);
  }

  // Eliminar un usuario (soft delete)
  async eliminarUsuario(id: number, deleted_id: number, deleted_at: string): Promise<any> {
    const sql = `
      UPDATE users
      SET deleted_id = ?, deleted_at = ?
      WHERE id = ?;
    `;
    const params = [deleted_id, deleted_at, id];
    return await this.databaseService.execute(sql, params);
  }
}
