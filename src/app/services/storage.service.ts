import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() { }

  /**
   * Obtiene un valor del localStorage.
   * @param key La clave del valor a obtener.
   * @returns El valor asociado a la clave, o `null` si no existe.
   */
  get(key: string): any {
    if (!this.exists(key)) {
      console.warn(`La clave "${key}" no existe en el localStorage.`);
      return null;
    }

    try {
      const value = localStorage.getItem(key);
      // Intenta parsear el valor como JSON
      return JSON.parse(value!);
    } catch (error) {
      console.error(`Error al parsear el valor de la clave "${key}":`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en el localStorage.
   * @param key La clave bajo la cual se guardará el valor.
   * @param value El valor a guardar.
   */
  set(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error al guardar la clave "${key}" en el localStorage:`, error);
    }
  }

  /**
   * Elimina una clave del localStorage.
   * @param key La clave a eliminar.
   */
  remove(key: string): void {
    if (!this.exists(key)) {
      console.warn(`La clave "${key}" no existe en el localStorage.`);
      return;
    }
    localStorage.removeItem(key);
  }

  /**
   * Limpia todo el contenido del localStorage.
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Verifica si una clave existe en el localStorage.
   * @param key La clave a verificar.
   * @returns `true` si la clave existe, `false` en caso contrario.
   */
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
