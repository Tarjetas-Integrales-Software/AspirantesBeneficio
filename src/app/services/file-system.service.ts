import { Injectable } from '@angular/core';
import { ElectronService } from '../services/electron.service';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {

  private fs: any;
  private path: any;
  readonly readmeContent = 'Este archivo mantiene el directorio no vacío para propósitos de la aplicación';

  constructor(private electronService: ElectronService) {
    if (this.electronService.isElectron) {
      this.fs = window.require('fs');
      this.path = window.require('path');
    }
  }

  ensureDirectoryExists(directoryPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.electronService.isElectron) {
        console.warn('File system operations only available in Electron');
        return resolve(false);
      }

      this.fs.mkdir(directoryPath, { recursive: true }, (err: any) => {
        if (err) {
          console.error('Error creating directory:', err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  directoryExists(directoryPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.electronService.isElectron) {
        return resolve(false);
      }

      this.fs.stat(directoryPath, (err: any, stats: any) => {
        if (err) {
          resolve(false);
        } else {
          resolve(stats.isDirectory());
        }
      });
    });
  }


  async ensureFileExists(filePath: string, directoryPath: string): Promise<void> {
    if (!this.electronService.isElectron) {
      console.warn('File system operations only available in Electron');
    }

    const filePath_combinado = this.path.join(directoryPath, filePath);

    try {
      // Crear directorio si no existe (con recursive: true)
      await this.ensureDirectoryExists_aux(directoryPath);

      // Verificar si el archivo README.txt existe
      const exists = await this.fileExists(filePath_combinado);

      if (!exists) {
        await this.createFile(filePath_combinado);
      }
    } catch (error) {
      console.error('Error al verificar/crear el archivo solicitado', error);
    }
  }

  private async ensureDirectoryExists_aux(dirPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.mkdir(dirPath, { recursive: true }, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.fs.access(filePath, this.fs.constants.F_OK, (err: any) => {
        resolve(!err);
      });
    });
  }

  private async createFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.writeFile(filePath, this.readmeContent, { flag: 'wx' }, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }



  async checkPermissions(directoryPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.electronService.isElectron) return resolve(false);

      this.fs.access(directoryPath, this.fs.constants.W_OK, (err: any) => {
        resolve(!err);
      });
    });
  }

}
