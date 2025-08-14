import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, forkJoin, from, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { DatabaseService } from '../database.service';
import { PDFDocument } from 'pdf-lib';
import { error } from 'console';

const electronAPI = (window as any).electronAPI;

const path = electronAPI?.path;
const fs = electronAPI?.fs;

@Injectable({
  providedIn: 'root'
})
export class DigitalizarArchivosService {
  private http = inject(HttpClient);
  private appPath: string = '';

  constructor(private databaseService: DatabaseService
  ) {
    this.loadAppPath();
  }

  private async loadAppPath(): Promise<void> {
    try {
      if (window.electronAPI?.getAppPath)
        this.appPath = await window.electronAPI.getAppPath();
      else
        this.appPath = '';
    } catch (error) {
      console.log(error);
    }
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

  getGruposAll(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion_grupos');
  }

  edit_archivo_esperado(nombre_archivo: string, status: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/edit', { nombre_archivo: nombre_archivo, status: status });
  }

  delete(id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/delete', { id: id });
  }

  private createRegexFromString(regexString: string): RegExp | null {
    try {
      // Eliminar espacios en blanco al inicio/final
      const trimmedString = regexString.trim();

      // Caso 1: Formato con barras (/patrón/banderas)
      if (trimmedString.startsWith('/')) {
        const lastSlashIndex = trimmedString.lastIndexOf('/');

        // Si no hay segunda barra (ej: "/pattern")
        if (lastSlashIndex <= 0) return null;

        const pattern = trimmedString.slice(1, lastSlashIndex);
        const flags = trimmedString.slice(lastSlashIndex + 1);

        return pattern ? new RegExp(pattern, flags) : null;
      }
      // Caso 2: Formato simple (patrón sin banderas)
      else {
        return trimmedString ? new RegExp(trimmedString) : null;
      }
    } catch (error) {
      console.error('Error al crear RegExp:', error);
      return null;
    }
  }

  extraerCURP(texto: string, regexCURP: RegExp | string): string {
    let regex: RegExp;

    if (typeof regexCURP === 'string') {
      const createdRegex = this.createRegexFromString(regexCURP);
      if (!createdRegex) return '';
      regex = createdRegex;
    } else {
      regex = regexCURP;
    }

    const coincidencia = texto.match(regex);
    return coincidencia?.[1]?.toUpperCase() || '';
  }

  procesarArchivosBaseLocal(carpetaOrigen: string, pesoMinimo: number, extension: string, tipo: string, regexCurp: RegExp) {
    return from(this.verificarYCargarArchivos(carpetaOrigen, pesoMinimo, extension)).pipe(
      switchMap(archivos => {
        const procesos = archivos.map(archivo => {
          const ahora = new Date();
          const fechaFormateada = ahora.toISOString().replace('T', ' ').substring(0, 19);
          const curpParseada = this.extraerCURP(path.basename(archivo), regexCurp);
          const carpetaDestino = path.join(this.appPath, 'archivosDigitalizados');

          if (!fs.existsSync(carpetaDestino)) {
            fs.mkdirSync(carpetaDestino, { recursive: true });
          }

          this.guardarArchivoBaseLocal({
            fecha: fechaFormateada,
            tipo: tipo,
            curp: curpParseada,
            carpetaOrigen: carpetaOrigen,
            carpetaDestino: carpetaDestino,
            extension: extension
          });

          fs.renameSync(archivo, path.join(carpetaDestino, curpParseada + '.' + extension));
        }
        );
        return procesos
      }),
      catchError(error => {
        console.log(`Error general al procesar archivos: ${error.message}`);
        throw error;
      })
    );
  }

  async procesarArchivosEnParalelo(carpetaDestino: string, pesoMinimo: number, extension: string, tipo: string): Promise<void> {
    const carpetaOrigen = path.join(this.appPath, 'archivosDigitalizados');

    const archivos = await this.verificarYCargarArchivos(carpetaOrigen, pesoMinimo, extension);

    if (archivos.length === 0) {
      console.warn('No hay archivos para procesar');
    }

    archivos.map(archivo => {
      return this.procesarArchivo(archivo, carpetaOrigen, carpetaDestino, tipo);
    });
  }

  private async verificarYCargarArchivos(
    carpetaOrigen: string,
    pesoMinimo: number | null,
    extension: string | null
  ): Promise<string[]> {
    try {
      const electronAPI = (window as any).electronAPI;

      if (!fs.existsSync(carpetaOrigen)) {
        fs.mkdirSync(carpetaOrigen, { recursive: true });
      }

      return await electronAPI.invoke('get-filtered-files', {
        folder: carpetaOrigen,
        minSize: pesoMinimo,
        extension: extension || undefined
      });
    } catch (error) {
      console.error('Error al obtener archivos:', error);
      return [];
    }
  }

  async guardarArchivoBaseLocal(archivo: {
    fecha: string,
    tipo: string,
    curp: string,
    carpetaOrigen: string,
    carpetaDestino: string,
    extension: string
  }): Promise<any> {
    const sql = `
      INSERT OR REPLACE INTO archivos_digitalizar (
        fecha, tipo, curp, carpetaOrigen, carpetaDestino, extension
      ) VALUES (?, ?, ?, ?, ?, ?);
    `;
    const params = [
      archivo.fecha,
      archivo.tipo,
      archivo.curp,
      archivo.carpetaOrigen,
      archivo.carpetaDestino,
      archivo.extension
    ];

    return await this.databaseService.execute(sql, params);
  }

  private procesarArchivo(archivo: string, carpetaOrigen: string, carpetaDestino: string, tipo: string): void {
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
        tipo: tipo
      }

      console.log('Lo que se sube: ', beneficiario, documento, carpetaOrigen, extension);
      

      this.subirArchivo(beneficiario, documento, carpetaOrigen, extension).then((observableObject) => {
        observableObject.subscribe({
          next: (response) => {
            if (response.data) {
              const { filename, grupo } = response.data;
              const parsedFileName = filename.replaceAll('.pdf', '');

              this.actualizarGrupoPorCurp(parsedFileName, grupo);

              const destino = path.join(carpetaDestino, path.basename(archivo));
              electronAPI.moveFileCrossDevice(archivo, destino);

              this.edit_archivo_esperado(parsedFileName, 1).subscribe({
                next: (response) => {

                },
                error: (error) => {
                  console.error('Error al actualizar el archivo esperado:', error);
                }
              })
            }
          },
          error: (error) => {
            console.error('Error al subir el archivo:', error);
          }
        })
      })
        .catch((error) => {
          // Handle any errors that occurred during the Promise resolution
          console.error("Error resolving promise:", error);
        });
    } catch (ex) {
      const error = ex as Error;
      //this.logger.error(`Excepción al procesar archivo ${archivo}: ${ex.message}`);
      console.log(`Excepción al procesar archivo ${archivo}: ${error.message}`);
    }
  }

  async subirArchivo(beneficiario: any, documento: any, carpetaOrigen: string, extension: string): Promise<Observable<any>> {
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
      return this.http.post(environment.apiUrl + '/lic/aspben/digitalizar_archivos/registrar-archivo', formData, {
        headers: new HttpHeaders({
          'Accept': 'application/json'
        })
      });
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

  getArchivosPendientesEnviar(nombre_archivo_upload: string): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/rep_get_nombres_archivo_esperados_por_archivo_upload', { nombre_archivo_upload: nombre_archivo_upload });
  }

  async consultarPendientesDigitalizar(): Promise<{ id: number; fecha: string; tipo: string; curp: string; carpetaOrigen: string, carpetaDestino: string, extension: string }[]> {
    const sql = `
      SELECT *
      FROM archivos_digitalizar
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;

    // Ejecutar la consulta
    return this.databaseService.query(sql);
  }

  async consultarPendientesDigitalizarCurp(
    curp: string,
  ): Promise<
    {
      id: number;
      fecha: string;
      tipo: string;
      curp: string;
      carpetaOrigen: string;
      carpetaDestino: string;
      extension: string;
    }[]
  > {
    const sql = `
      SELECT *
      FROM archivos_digitalizar
      WHERE deleted_at IS NULL AND curp = ?
      ORDER BY id;
    `;

    try {
      const resultados = await this.databaseService.query(sql, [curp]);
      return resultados;
    } catch (error) {
      console.error('Error al buscar por CURP:', error);
      return []; // Retorna array vacío en caso de error
    }
  }

  async consultarPendientesDigitalizarFiltrados(
    curp: string,
    grupo: string
  ): Promise<
    {
      id: number;
      fecha: string;
      tipo: string;
      curp: string;
      carpetaOrigen: string;
      carpetaDestino: string;
      extension: string;
      grupo: string;
    }[]
  > {
    let condiciones: string[] = ['deleted_at IS NULL'];
    let parametros: any[] = [];

    if (curp) {
      condiciones.push('curp = ?');
      parametros.push(curp);
    }

    if (grupo) {
      condiciones.push('grupo = ?');
      parametros.push(grupo);
    }

    const sql = `
    SELECT *
    FROM archivos_digitalizar
    WHERE ${condiciones.join(' AND ')}
    ORDER BY id;
  `;

    try {
      const resultados = await this.databaseService.query(sql, parametros);
      return resultados;
    } catch (error) {
      console.error('Error al buscar con filtros:', error);
      return [];
    }
  }

  async consultarCantidadDigitalizados(grupo: string): Promise<number> {
    const sql = `
      SELECT COUNT(DISTINCT curp) as cantidad
      FROM archivos_digitalizar
      WHERE deleted_at IS NULL AND grupo = ?;
    `;

    try {
      const resultados = await this.databaseService.query(sql, [grupo]);
      return resultados[0]?.cantidad || 0;
    } catch (error) {
      console.error('Error al contar CURPs únicas por grupo:', error);
      return 0;
    }
  }

  async actualizarGrupoPorCurp(
    curp: string,
    nuevoGrupo: string
  ): Promise<number> {
    const sqlUpdate = `
    UPDATE archivos_digitalizar
    SET grupo = ?
    WHERE deleted_at IS NULL AND curp = ?;
  `;

    try {
      const result = await this.databaseService.execute(sqlUpdate, [nuevoGrupo, curp]);

      if (typeof result === 'number') {
        return result; // Si el backend devuelve directamente el número
      } else if (result && typeof result.affectedRows === 'number') {
        return result.affectedRows; // Si es un objeto con propiedad affectedRows
      } else if (result && typeof result.changes === 'number') {
        return result.changes; // Para SQLite
      }

      return 1;
    } catch (error) {
      console.error('Error al actualizar grupo por CURP:', error);
      throw error; // Propaga el error para manejarlo en el componente
    }
  }

  filtrarArchivosNoExistentes(archivos: string[]): Observable<any> {
    return this.http.post(environment.apiUrl + '/lic/aspben/archivos_esperados_digitalizacion/filtrar_archivos_no_existentes', { archivos });
  }
}
