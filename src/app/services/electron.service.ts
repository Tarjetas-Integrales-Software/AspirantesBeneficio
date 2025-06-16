import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  private electron: typeof import('electron') | undefined;

  constructor() {
    // Solo intenta cargar Electron si estamos en ese entorno
    if (this.isElectron) {
      this.electron = window.require('electron');
    }
  }

  // Verifica si estamos ejecutando en Electron
  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  // Proporciona acceso a ipcRenderer
  get ipcRenderer(): import('electron').IpcRenderer | undefined {
    return this.isElectron ? this.electron?.ipcRenderer : undefined;
  }

  // Proporciona acceso a remote (requiere @electron/remote)
  get remote(): any {
    return this.isElectron ? window.require('@electron/remote') : undefined;
  }

  // Proporciona acceso al shell de Electron
  get shell(): import('electron').Shell | undefined {
    return this.isElectron ? this.electron?.shell : undefined;
  }

  // Proporciona acceso al dialog de Electron
  get dialog(): import('electron').Dialog | undefined {
    return this.isElectron ? this.electron?.dialog : undefined;
  }

  async selectFolder(): Promise<string | null> {
    try {
      return await window.electronAPI?.selectFolder() ?? null
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }
}
