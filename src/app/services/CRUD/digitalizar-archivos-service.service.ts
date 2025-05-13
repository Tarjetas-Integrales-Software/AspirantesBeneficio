import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, forkJoin, from, Observable, of, switchMap } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

const { ipcRenderer } = (window as any).require("electron");
const path = (window as any).require('path');
const fs = (window as any).require('fs');

//import { NGXLogger } from 'ngx-logger';


@Injectable({
  providedIn: 'root'
})
export class DigitalizarArchivosServiceService {

  private _token: string = '';

  private http = inject(HttpClient);
  constructor(private databaseService: DatabaseService
    //, private logger: NGXLogger
  ) {

  }




  BulkInsert_InBatches(data: any[], batchSize: number = 100): Observable<any> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    batches.forEach((batch, index) => {
      this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/bulk-insert', { registros: batch }).subscribe(response => {
        console.log(`Lote ${index + 1} enviado correctamente`, response);
      });
    });

    return of(null);
  }

  delete(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/delete', { id: id });
  }


  setToken(token: string): void {
    this._token = token;
  }

  procesarArchivosEnParalelo(carpetaOrigen: string, carpetaDestino: string): Observable<boolean[]> {
    return from(this.verificarYCargarArchivos(carpetaOrigen)).pipe(
      switchMap(archivos => {
        const procesos = archivos.map(archivo =>
          this.procesarArchivo(archivo, carpetaOrigen, carpetaDestino)
          //this.procesarArchivo2(archivo)
        );
        return forkJoin(procesos);
      }),
      catchError(error => {
        //this.logger.error(`Error general al procesar archivos: ${error.message}`);
        console.log(`Error general al procesar archivos: ${error.message}`);
        throw error;
      })
    );
  }

  private async verificarYCargarArchivos(carpetaOrigen: string): Promise<string[]> {
    // En Electron, usaríamos el módulo 'fs' para acceder al sistema de archivos
    const fs = (window as any).require('fs');
    const path = (window as any).require('path');

    if (!fs.existsSync(carpetaOrigen)) {
      //this.logger.error(`Carpeta no existe: ${carpetaOrigen}`);
      console.log(`Carpeta no existe: ${carpetaOrigen}`);
      return [];
    }

    return fs.readdirSync(carpetaOrigen)
      .filter((file: string) => file.endsWith('.pdf'))
      .map((file: string) => path.join(carpetaOrigen, file));
  }

  private procesarArchivo2(archivo: string,): Observable<boolean>{
    console.log(archivo,'archivo_actual');
    return of(true);
  }

  private procesarArchivo(archivo: string, carpetaOrigen: string, carpetaDestino: string): Observable<boolean> {
    try {
      const curp = path.basename(archivo,'.pdf').toUpperCase();

      console.log(curp);

      let beneficiario = {
        id: 1,
        curp: curp
      }

      let documento = {
        archivo: archivo,
        fecha: '2025-05-12',
        tipo:'expediente_beneficiario'
      }

      return from(this.subirArchivo(beneficiario, documento)).pipe(
        switchMap(exito => {
          if (exito) {
            try {
              const destino = path.join(carpetaDestino, path.basename(archivo));
              fs.renameSync(archivo, destino);
              //this.logger.info(`Archivo movido a enviados: ${archivo}`);
              console.log(`Archivo movido a enviados: ${archivo}`);
              return of(true);
            } catch (ex) {
              const error = ex as Error;
              //this.logger.error(`Error al mover archivo ${archivo}: ${ex.message}`);
              console.log(`Error al mover archivo ${archivo}: ${error.message}`);
              return of(false);
            }
          }
          return of(false);
        }),
        catchError(error => {
          //this.logger.error(`Error general al procesar archivo ${archivo}: ${error.message}`);
          console.log(`Error general al procesar archivo ${archivo}: ${error.message}`);
          return [false];
        })
      );
    } catch (ex) {
      const error = ex as Error;
      //this.logger.error(`Excepción al procesar archivo ${archivo}: ${ex.message}`);
      console.log(`Excepción al procesar archivo ${archivo}: ${error.message}`);
      return of(false);
    }
  }

  async subirArchivo(beneficiario: any, documento: any) {
      // Leer el documento desde el main process
    const { archivo, fecha, tipo } = documento;
    const { id, curp } = beneficiario;

    try {
        // Leer el archivo PDF desde el proceso principal
        const fileData = await this.getFileFromMainProcess(curp);

        // Crear el FormData
        const formData = new FormData();
        formData.append('fecha', fecha);
        formData.append('tipo', tipo);
        formData.append('curp', curp);
        formData.append('id_beneficiario', id.toString());

        // Convertir el buffer a un archivo Blob con el tipo correcto
        const blob = new Blob([fileData], { type: 'application/pdf' });
        formData.append('file', blob, archivo);

        // Enviar la petición POST al backend
        return await this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/registrar-archivo', formData, {
            headers: new HttpHeaders({
                'Accept': 'application/json'
            })
        }).toPromise();
    } catch (error) {
        console.error("Error al registrar el archivo:", error);
        throw error;
    }
  }

  private getFileFromMainProcess(fileName: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {

      const requestId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const successEvent = `pdf-read-success-${requestId}`;
      const errorEvent = `pdf-read-error-${requestId}`;

      // Escucha respuestas con IDs únicos
      ipcRenderer.once(successEvent, (_event: any, data: any) => {
        resolve(data);
      });

      ipcRenderer.once(errorEvent, (_event: any, err: any) => {
        reject(err);
      });

      // Enviar la solicitud al proceso principal con el ID incluido
      ipcRenderer.send('get-archivo-digitalizado', { fileName, requestId });

    });
  }

}
