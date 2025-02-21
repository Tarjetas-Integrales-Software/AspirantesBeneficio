import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private onlineStatus$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$).subscribe(status => this.onlineStatus$.next(status));
  }

  get isOnline(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }

  checkConnection(): boolean {
    return navigator.onLine;
  }
}
