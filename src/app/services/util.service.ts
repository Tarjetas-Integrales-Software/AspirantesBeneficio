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

  enviarDatosAlServidor(datos: any[]) {
    // this.curpsAprobadasSsasService.createCurpAprobadaSsas(datos);
  }


}
