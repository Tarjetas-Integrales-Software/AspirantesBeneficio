import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BeneficiarioSsas } from '../../pages/consulta-ssas/interfaces/BeneficiarioSsas.interface';
import { Observable } from 'rxjs';
import { environment } from './../../../environments/environment';
import { CatalogoSsas } from '../../pages/consulta-ssas/interfaces/CatalogoSsas.interface';
import { IDSPermitidos } from '../../pages/consulta-ssas/interfaces/IdsPermitidos.interface';

@Injectable({
  providedIn: 'root'
})
export class BeneficiarioSsasService {

  private http = inject(HttpClient);

  constructor() { }

  private apiUrlSsas = 'https://apimipasaje-ssas.jalisco.gob.mx/'


  getBeneficiarioSsas(curp: string): Observable<BeneficiarioSsas> {
    return this.http.get<BeneficiarioSsas>(`${this.apiUrlSsas}beneficiario/${curp}`);
  }

  registerConsultaSsas(curp: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/lic/aspben/consulta_ssas/register`, { curp });
  }

  consultaCatalogoSsas(): Observable<CatalogoSsas> {
    return this.http.get<CatalogoSsas>(`${environment.apiUrl}/lic/aspben/consulta_ssas_catalogos`);
  }

  getIdsPermitidos(): Observable<IDSPermitidos> {
    return this.http.get<IDSPermitidos>(`${environment.apiUrl}/lic/aspben/consulta_ssas_ids_permitidos_refrendo`);
  }

}
