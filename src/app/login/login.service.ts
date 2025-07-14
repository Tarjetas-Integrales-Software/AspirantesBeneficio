import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private configSubject = new BehaviorSubject<any>(null); // Aquí se guarda toda la configuración

  login(credentials: { email: string, password: string}): Observable<any> {
    return this.http.post(environment.apiUrl + "/login", credentials);
  }

  constructor() { }

  loadConfigStyle(): void {
    // Solo hace la petición si aún no hay datos
    if (!this.configSubject.value) {
      this.http.get<any>(`${environment.apiUrl}/lic/imagenes_all`)
        .subscribe(resp => this.configSubject.next(resp.data));
    }
  }

  get configuraciones$(): Observable<any> {
    return this.configSubject.asObservable();
  }


}
