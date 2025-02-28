import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Jalisco } from '../../../../public/assets/data/jalisco.interface';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  private http = inject(HttpClient);

  getJaliscoData(): Observable<Jalisco> {
    return this.http.get<Jalisco>('assets/data/jalisco.json');
  }

  getJaliscoByCP(cp: string): Observable<Jalisco> {
    return this.http.get<Jalisco>(`assets/data/jalisco.json`)
      .pipe(
        map((data: Jalisco) => {
          return {
            response: data.response,
            data: data.data.filter(item => item.cp === cp),
            message: data.message,
            status: data.status
          };
        })
      );
  }
}
