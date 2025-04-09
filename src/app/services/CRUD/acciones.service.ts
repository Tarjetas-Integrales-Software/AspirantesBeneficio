import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from './../database.service';

@Injectable({
  providedIn: 'root'
})
export class AccionesService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }


  getCurpsReenviarActivos(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/curps_reenviar_activos');
  }

}
