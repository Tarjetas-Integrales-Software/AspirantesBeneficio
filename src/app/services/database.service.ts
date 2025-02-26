import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private ipcRenderer?: typeof ipcRenderer; // Permite que pueda ser undefined

  constructor() {
    this.initIpcRenderer();
  }

  private initIpcRenderer() {
    try {
      if ((window as any).require) {
        this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      } else {
        console.warn('Electron IPC was not loaded');
      }
    } catch (error) {
      console.error('Error loading Electron IPC:', error);
    }
  }

  query(sql: string, params: any[] = []): Promise<any> {
    if (!this.ipcRenderer) {
      return Promise.reject('IPC Renderer not initialized');
    }
    return this.ipcRenderer.invoke('query', sql, params);
  }

  execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.ipcRenderer) {
      console.warn('IPC Renderer not initialized. Running in a non-Electron environment?');
      return Promise.resolve(null);
    }
    return this.ipcRenderer.invoke('execute', sql, params);
  }
}
