import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AspiranteBeneficio {
  nombreBeneficiario: string;
  curp: string;
  telefono: string;
  fechaExpedicion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImpresionManualService {

  private http = inject(HttpClient);

  constructor() { }

  registerImpresionYoJalisco(aspirante: AspiranteBeneficio): Observable<AspiranteBeneficio> {
    return this.http.post<AspiranteBeneficio>(environment.apiUrl + '/lic/aspben/impresion_beneficio_cincuenta/register', { ...aspirante });
  }

  registerImpresionZapopan(aspirante: AspiranteBeneficio): Observable<AspiranteBeneficio> {
    return this.http.post<AspiranteBeneficio>(environment.apiUrl + '/lic/aspben/impresion_zapopan/register', { ...aspirante });
  }
}
