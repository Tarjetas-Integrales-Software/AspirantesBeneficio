import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Jalisco } from '../../../../public/assets/data/jalisco.interface';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(private http: HttpClient) { }

  getJaliscoData(): Observable<Jalisco> {
    return this.http.get<Jalisco>('assets/data/jalisco.json');
  }
}
