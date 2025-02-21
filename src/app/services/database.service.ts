import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private ipcRenderer!: typeof ipcRenderer;

  constructor() {
    if ((window as any).require) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
    } else {
      console.warn('Electron IPC was not loaded');
    }
  }

  query(sql: string, params: any[] = []): Promise<any> {
    return this.ipcRenderer.invoke('query', sql, params);
  }

  execute(sql: string, params: any[] = []): Promise<any> {
    return this.ipcRenderer.invoke('execute', sql, params);
  }
}