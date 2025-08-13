import { Injectable, inject } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseService } from '../../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutsImpresionService {
  private http = inject(HttpClient);

  constructor(private databaseService: DatabaseService) { }

  get(): Observable<any> {
    return this.http.get(environment.apiUrl + '/lic/aspben/layouts_impresion_all');
  }
}
