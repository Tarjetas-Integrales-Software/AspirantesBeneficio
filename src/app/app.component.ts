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

import { environment } from '../environments/environment';

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
    this.checkAndSyncCurps();

    this.startSyncInterval();
    this.startSyncCurpInterval();
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
      this.syncAspirantesBeneficio();
    });
  }

  private checkAndSyncCurps(): void {
    this.networkStatusService.isOnline.pipe(
      take(1),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarCurps();
    });
  }

  private startSyncInterval(): void {
    this.syncSubscription = interval(environment.syncInterval).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.syncAspirantesBeneficio();
    });
  }

  private startSyncCurpInterval(): void {
    this.syncSubscription = interval(environment.syncInterval).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarCurps();

      this.validarSincronizacionCompleta(); //EMD
    });
  }

  async syncAspirantesBeneficio(): Promise<void> {
    try {
      const items = await this.aspirantesBeneficioFotosService.consultarRelacionesDesincronizadas();

      for (const relacion of items) {
        const { id_aspirante_beneficio, id_foto } = relacion;

        try {
          const aspirante = await this.aspirantesBeneficioService.consultarAspirantePorId(id_aspirante_beneficio);
          const foto = await this.fotosService.consultarFotoPorId(id_foto);

          let nuevoAspirante = {};
          let nuevaFoto = {};
          let nuevoIdAspirante: number | null = null;
          let nuevoIdFoto: number | null = null;

          // Crear aspirante y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.aspirantesBeneficioService.createAspirante(aspirante).subscribe({
              next: async (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdAspirante = response.data.id;
                  nuevoAspirante = response.data;
                }

                resolve();
              },
              error: (error) => {
                console.error("Error al crear aspirante:", error);
                reject(error);
              }
            });
          });

          // Crear foto y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.fotosService.createFoto(foto).subscribe({
              next: (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdFoto = response.data.id;
                  nuevaFoto = response.data;
                }
                resolve();
              },
              error: (error) => {
                console.error("Error al crear foto:", error);
                reject(error);
              }
            });
          });

          // Verificamos que los IDs sean números válidos antes de crear la relación
          if (typeof nuevoIdAspirante === "number" && typeof nuevoIdFoto === "number") {
            const nuevaRelacion = {
              id_aspirante_beneficio: nuevoIdAspirante,
              id_foto: nuevoIdFoto
            };

            this.aspirantesBeneficioFotosService.createRelacion(nuevaRelacion).subscribe({
              next: (response) => {
                if (response.response) {
                  this.aspirantesBeneficioFotosService.eliminarRelacion(relacion.id);

                  this.fotosService.registerPhoto(nuevoAspirante, nuevaFoto)
                }
              },
              error: (error) => {
                this.eliminarRelacionados(nuevoIdAspirante, nuevoIdFoto);

                console.error("Error al crear relación:", error);
              }
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");

            this.eliminarRelacionados(nuevoIdAspirante, nuevoIdFoto);
          }
        } catch (error) {
          console.error("Error obteniendo aspirante o foto:", error);
        }
      }
    } catch (error) {
      console.error("Error consultando relaciones:", error);
    }
  }

  async validarSincronizacionCompleta(): Promise<void>{
    const items = await this.aspirantesBeneficioFotosService.consultarRelacionesDesincronizadas();
    if(items.length > 0){
      return this.aspirantesBeneficioFotosService.updateSyncStatus(false);
    }else{
      return this.aspirantesBeneficioFotosService.updateSyncStatus(true);
    }
  }

  actualizarCurps(): void {
    this.curpsRegistradasService.getCurpsRegistradas().subscribe({
      next: ((response) => {
        this.curpsRegistradasService.syncLocalDataBase(response.data)
      }),
      error: ((error) => { })
    });
  }

  eliminarRelacionados(nuevoIdAspirante: null | number, nuevoIdFoto: null | number): void {
    if (typeof nuevoIdAspirante === "number") this.aspirantesBeneficioService.deleteAspiranteBeneficio(nuevoIdAspirante).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdAspirante = null;
      },
      error: (error) => {
        console.error("Error al crear aspirante:", error);
      }
    });

    if (typeof nuevoIdFoto === "number") this.fotosService.deleteFoto(nuevoIdFoto).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdFoto = null;
      },
      error: (error) => {
        console.error("Error al crear aspirante:", error);
      }
    });
  }
}
