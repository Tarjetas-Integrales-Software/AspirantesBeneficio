import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Necesitamos importar el servicio de base de datos para acceder a SQLite
import { DatabaseService } from '../database.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private databaseService = inject(DatabaseService);

  getOpcionesMenu(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/opciones_menu');
  }

  /**
   * Obtiene las opciones del menú desde la base de datos local
   * @returns Promise con las opciones de menú
   */
  async getOpcionesMenuLocal(): Promise<any[]> {
    try {
      const result = await this.databaseService.query(
        `SELECT * FROM cat_ct_configuraciones WHERE clave LIKE 'menu_habilitar_%' AND valor = '1'`
      );
      return result || [];
    } catch (error) {
      console.error('Error al consultar opciones de menú locales:', error);
      return [];
    }
  }

  /**
   * Sincroniza las opciones de menú en la base de datos local
   * @param opciones Las opciones de menú a sincronizar
   */
  async syncMenuOptionsLocal(opciones: any[]): Promise<void> {
    try {
      // Por cada opción, insertarla o actualizarla en la base de datos local
      for (const opcion of opciones) {
        await this.databaseService.execute(
          `INSERT OR REPLACE INTO cat_ct_configuraciones (id, id_equipo, clave, valor, descripcion, created_at, updated_at, deleted_at, created_id, updated_id, deleted_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [opcion.id, opcion.id_equipo || 1, opcion.clave, opcion.valor, opcion.descripcion, opcion.created_at, opcion.updated_at, opcion.deleted_at, opcion.created_id, opcion.updated_id, opcion.deleted_id]
        );
      }
    } catch (error) {
      console.error('Error al sincronizar opciones de menú en la base de datos local:', error);
    }
  }
}
