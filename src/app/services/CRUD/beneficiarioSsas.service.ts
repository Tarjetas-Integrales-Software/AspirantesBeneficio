import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BeneficiarioSsas } from '../../pages/consulta-ssas/interfaces/BeneficiarioSsas.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BeneficiarioSsasService {

  private http = inject(HttpClient);

  constructor() { }

  private apiUrl = 'https://apimipasaje-ssas.jalisco.gob.mx/'

  getBeneficiarioSsas(curp: string): Observable<BeneficiarioSsas> {
    return this.http.get<BeneficiarioSsas>(`${this.apiUrl}beneficiario/${curp}`);
  }

}
