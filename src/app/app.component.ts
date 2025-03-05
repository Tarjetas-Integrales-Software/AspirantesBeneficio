import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { StorageService } from './services/storage.service';
import { NetworkStatusService } from './services/network-status.service';
import { AspirantesBeneficioService } from './services/CRUD/aspirantes-beneficio.service';
import { FotosService } from './services/CRUD/fotos.service';
import { AspirantesBeneficioFotosService } from './services/CRUD/aspirantes-beneficio-fotos.service';
import { CurpsRegistradasService } from './services/CRUD/curps-registradas.service';

import { interval, Subscription } from 'rxjs';
import { switchMap, filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Aspirantes';

  aspirantesBeneficio: any[] = [];
  fotos: any[] = [];
  aspirantesBeneficioFotos: any[] = [];

  private syncSubscription: Subscription | undefined;

  constructor(
    private storageService: StorageService,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private fotosService: FotosService,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private curpsRegistradasService: CurpsRegistradasService
  ) { }

  ngOnInit(): void {
    this.checkAndSync();

    this.startSyncInterval();
  }

  ngOnDestroy(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  private checkAndSync(): void {
    this.networkStatusService.isOnline.pipe(
      take(1),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.sincronizarBase();
    });
  }

  private startSyncInterval(): void {
    this.syncSubscription = interval(600000).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.sincronizarBase();
    });
  }

  private sincronizarBase(): void {
    this.syncAspirantesBeneficio();
    this.syncFotos();
    this.syncAspirantesBeneficioFotos();
    this.actualizarCurps();
  }

  syncAspirantesBeneficio(): void {
    this.aspirantesBeneficioService.consultarAspirantes().then((items) => {
      this.aspirantesBeneficio = items;

      items.map((item) => {
        this.aspirantesBeneficioService.createAspirante(item).subscribe({
          next: (response) => {
            if (response.response) this.aspirantesBeneficioService.deleteAspirante(item.id);
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
          }
        })
      });
    });
  }
  syncFotos(): void {
    this.fotosService.consultarFotos().then((items) => {
      this.fotos = items;

      items.map((item) => {
        this.fotosService.createFoto(item).subscribe({
          next: (response) => {
            if (response.response) this.fotosService.eliminarFoto(item.id);
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
          }
        })
      });
    });
  }
  actualizarCurps(): void {
    this.curpsRegistradasService.getCurpsRegistradas().subscribe({
      next: ((response) => {
        this.curpsRegistradasService.syncLocalDataBase(response.data)
      }),
      error: ((error) => { })
    });
  }
  syncAspirantesBeneficioFotos(): void {
    this.aspirantesBeneficioFotosService.consultarRelaciones().then((items) => {
      this.aspirantesBeneficioFotos = items;

      items.map((item) => {
        this.aspirantesBeneficioFotosService.createRelacion(item).subscribe({
          next: (response) => {
            if (response.response) this.aspirantesBeneficioFotosService.eliminarRelacion(item.id);
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
          }
        })
      });
    });
  }
}