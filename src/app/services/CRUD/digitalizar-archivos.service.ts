import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, forkJoin, from, Observable, of, switchMap } from 'rxjs';
import { DatabaseService } from '../database.service';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { PdfCompressService } from '../pdf-compress.service';

const electronAPI = (window as any).electronAPI;

const path = electronAPI?.path;
const fs = electronAPI?.fs;

//import { NGXLogger } from 'ngx-logger';


@Injectable({
  providedIn: 'root'
})
export class DigitalizarArchivosService {

  private _token: string = '';

  private http = inject(HttpClient);
  private pdfCompressService = inject(PdfCompressService);

  constructor(private databaseService: DatabaseService
  ) {

  }
  getArchivosEsperados(body: { search: string }): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion_search', body);
  }

  BulkInsert_InBatches(data: any[], batchSize: number = 100): Observable<any> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    batches.forEach((batch, index) => {
      this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/bulk-insert', { registros: batch }).subscribe(response => {
        console.log(`Lote ${index + 1} enviado correctamente`, response);
      });
    });

    return of(null);
  }



  edit_archivo_esperado(nombre_archivo: string, status: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/edit', { nombre_archivo: nombre_archivo, status: status });
  }

  delete(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/delete', { id: id });
  }


  setToken(token: string): void {
    this._token = token;
  }

  procesarArchivosEnParalelo(carpetaOrigen: string, carpetaDestino: string, pesoMinimo: number, extension: string): Observable<boolean[]> {
    return from(this.verificarYCargarArchivos(carpetaOrigen, pesoMinimo, extension)).pipe(
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

  private async verificarYCargarArchivos(carpetaOrigen: string, pesoMinimo: number, extension: string): Promise<string[]> {
    const electronAPI = (window as any).electronAPI;

    const path = electronAPI?.path;
    const fs = electronAPI?.fs;

    if (!fs.existsSync(carpetaOrigen)) {
      console.log(`Carpeta no existe: ${carpetaOrigen}`);
      return [];
    }

    return fs.readdirSync(carpetaOrigen)
      .filter((file: string) => {
        const fullPath = path.join(carpetaOrigen, file);
        const isPDF = file.toLowerCase().endsWith(extension.toLowerCase() || extension.toUpperCase());
        const sizeKB = fs.existsSync(fullPath) ? fs.statSync(fullPath).size / 1024 : 0;
        return isPDF && sizeKB >= pesoMinimo;
      })
      .map((file: string) => path.join(carpetaOrigen, file));
  }

  private procesarArchivo(archivo: string, carpetaOrigen: string, carpetaDestino: string): Observable<boolean> {
    try {
      const [curp, extension] = path.basename(archivo).split('.')

      const ahora = new Date();
      const fechaFormateada = ahora.toISOString().replace('T', ' ').substring(0, 19);

      const beneficiario = {
        id: 1,
        curp: curp.toUpperCase()
      }

      let documento = {
        archivo: archivo,
        fecha: fechaFormateada,
        tipo: 'expediente_beneficiario'
      }

      return from(this.subirArchivo(beneficiario, documento, carpetaOrigen, extension)).pipe(
        switchMap(exito => {
          if (exito) {
            try {
              //actualizar el status a 1 para indicar que ya fue digitalizado y enviado a TISA, en la tabla ct_archivos_esperados_digitalizados
              this.edit_archivo_esperado(curp.toUpperCase(), 1).subscribe({
                next: (data) => {

                }, error: (error) => {

                }
              });

              // Se mueve el archivo de digitalizados a enviados para que ya no se tome de nuevo
              const destino = path.join(carpetaDestino, path.basename(archivo));
              fs.renameSync(archivo, destino);
              return of(true);
            } catch (ex) {
              const error = ex as Error;
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

  async subirArchivo(beneficiario: any, documento: any, carpetaOrigen: string, extension: string) {
    // Leer el documento desde el main process
    const { archivo, fecha, tipo } = documento;
    const { id, curp } = beneficiario;

    try {
      const fileData = await this.getFileFromMainProcess(curp, carpetaOrigen, extension);

      // Leer el archivo PDF desde el proceso principal
      if (!(fileData && (fileData.constructor === ArrayBuffer || fileData.constructor === Uint8Array))) {
        throw new Error("Archivo inválido: no es un buffer");
      }

      // Optimizar el PDF
      const pdfDoc = await PDFDocument.load(fileData);

      // Configurar opciones de optimización
      const optimizedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,  // Reduce tamaño
      });

      // Crear el FormData
      const formData = new FormData();
      formData.append('fecha', fecha);
      formData.append('tipo', tipo);
      formData.append('curp', curp);
      formData.append('id_beneficiario', id.toString());

      // Convertir el buffer a un archivo Blob con el tipo correcto
      const blob = new Blob([optimizedPdfBytes], { type: 'application/pdf' });
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

  async getFileFromMainProcess(fileName: string, path: string, extension: string): Promise<ArrayBuffer> {
    const requestId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const successEvent = `pdf-read-success-${requestId}`;
    const errorEvent = `pdf-read-error-${requestId}`;

    if (!window.electronAPI) {
      throw new Error('Electron API no disponible');
    }

    try {
      return await window.electronAPI.getDigitalizedFile(path + '\\' + fileName + '.' + extension);
    } catch (error: any) {
      console.error('Error al obtener archivo digitalizado:', error);
      throw new Error(`Error al procesar ${fileName}: ${error.message}`);
    }
  }

  get_data_esperados_digitalizados(nombre_archivo_upload: string): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/rep_get_cantidades_por_archivo_upload', { nombre_archivo_upload: nombre_archivo_upload });
  }
}
