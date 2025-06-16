// database.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private ipcRenderer = (window as any).ipcRenderer;

  constructor() {
    if (!this.ipcRenderer) {
      console.warn('ipcRenderer no está disponible. Verifica preload.js y el entorno Electron.');
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.ipcRenderer) {
      throw new Error('IPC Renderer no disponible. ¿Estás en Electron con preload.js configurado?');
    }
    return this.ipcRenderer.invoke('query', sql, params);
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.ipcRenderer) {
      throw new Error('IPC Renderer no disponible. ¿Estás en Electron con preload.js configurado?');
    }
    return this.ipcRenderer.invoke('execute', sql, params);
  }
}
