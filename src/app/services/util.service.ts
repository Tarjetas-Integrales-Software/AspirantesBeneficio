import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { CurpsAprobadasSsasService } from './CRUD/curps-aprobadas-ssas.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilService {


  constructor(private http: HttpClient, private curpsAprobadasSsasService: CurpsAprobadasSsasService) { }

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



}
