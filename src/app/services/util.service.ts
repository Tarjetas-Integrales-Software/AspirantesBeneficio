import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { CurpsAprobadasSsasService } from './CRUD/curps-aprobadas-ssas.service';
import { Observable } from 'rxjs';
import { DigitalizarArchivosServiceService } from './CRUD/digitalizar-archivos-service.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {


  constructor(private http: HttpClient, private curpsAprobadasSsasService: CurpsAprobadasSsasService,
            private digitalizarArchivosServiceService: DigitalizarArchivosServiceService
  )
   { }

  generarNombreArchivoUnico(extension: string = 'pdf'): string {
    // Obtener la fecha actual
    const ahora = new Date();

    // Formatear componentes de fecha
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    // Construir el nombre del archivo
    const nombreBase = 'ArchivosEsperadosDigitalizar';
    const fechaHora = `${año}${mes}${dia}_${horas}${minutos}${segundos}`;

    // Asegurar que la extensión no tenga punto
    const ext = extension.replace(/^\./, '');

    return `${nombreBase}_${fechaHora}.${ext}`;
  }

  leerExcel(archivo: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(hoja);
        resolve(datos);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(archivo);
    });
  }

  leerExcel_v2(archivo: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {

        // const data = new Uint8Array(e.target.result);
        // console.log(data,'data');

        //const workbook = XLSX.read(data, { type: 'array' });
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        console.log(workbook,'workbook');

        const sheetName = workbook.SheetNames[0];
        console.log(sheetName,'sheetName');

        const worksheet = workbook.Sheets[sheetName];
        console.log(worksheet,'worksheet');

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(jsonData);

        // Convertir datos a formato esperado
        const registros = jsonData.map((row: any) => ({
          curp: row['CURP'] ? String(row['CURP']).trim() : null,
          nombre: row['NOMBRE'] ? String(row['NOMBRE']).trim() : null,
          apellido_paterno: row['PATERNO'] ? String(row['PATERNO']).trim() : null,
          apellido_materno: row['MATERNO'] ? String(row['MATERNO']).trim() : null,
          modulo: row['MODULO'] ? String(row['MODULO']).trim() : null,
          telefono: row['TELEFONO'] ? String(row['TELEFONO']).trim() : null,
          celular: row['CELULAR'] ? String(row['CELULAR']).trim() : null,
        }));

        console.log(registros);

        this.curpsAprobadasSsasService.BulkInsertCurpAprobadaSsas_InBatches(registros, 100);

        resolve(true);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(archivo);

    });
  }


  leerExcel_ArchivosDigitalizar(archivo: File, tipo_doc: number, ext: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {

        // const data = new Uint8Array(e.target.result);
        // console.log(data,'data');

        //const workbook = XLSX.read(data, { type: 'array' });
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        console.log(workbook,'workbook');

        const sheetName = workbook.SheetNames[0];
        console.log(sheetName,'sheetName');

        const worksheet = workbook.Sheets[sheetName];
        console.log(worksheet,'worksheet');

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log(jsonData);

        // Convertir datos a formato esperado
        const registros = jsonData.map((row: any) => ({
          id_tipo_documento_digitalizacion: tipo_doc,
          nombre_archivo: row['NOMBRE_ARCHIVO'] ? String(row['NOMBRE_ARCHIVO']).trim() : null,
          extension: ext,
          nombre_archivo_upload: this.generarNombreArchivoUnico()
          //row['NOMBRE_ARCHIVO_UPLOAD'] ? String(row['NOMBRE_ARCHIVO_UPLOAD']).trim() : null
        }));

        console.log(registros);

        this.digitalizarArchivosServiceService.BulkInsert_InBatches(registros, 100);

        resolve(true);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(archivo);

    });
  }

}
