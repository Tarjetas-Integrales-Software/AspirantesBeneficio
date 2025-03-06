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
    this.syncSubscription = interval(30000).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.sincronizarBase();
    });
  }

  private sincronizarBase(): void {
    this.syncAspirantesBeneficio();
    this.actualizarCurps();
  }

  async syncAspirantesBeneficio(): Promise<void> {
    console.log("Sincronizando aspirantes");

    try {
      const items = await this.aspirantesBeneficioFotosService.consultarRelaciones();

      for (const relacion of items) {
        const { id_aspirante_beneficio, id_foto } = relacion;

        try {
          const aspirante = await this.aspirantesBeneficioService.consultarAspirantePorId(id_aspirante_beneficio);
          const foto = await this.fotosService.consultarFotoPorId(id_foto);

          let nuevoIdAspirante: number | null = null;
          let nuevoIdFoto: number | null = null;

          // Crear aspirante y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.aspirantesBeneficioService.createAspirante(aspirante).subscribe({
              next: async (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdAspirante = response.data.id;
                  if (nuevoIdAspirante)
                    await this.aspirantesBeneficioService.deleteAspirante(nuevoIdAspirante);
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
                }
              },
              error: (error) => console.error("Error al crear relación:", error)
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");
          }
        } catch (error) {
          console.error("Error obteniendo aspirante o foto:", error);
        }
      }
    } catch (error) {
      console.error("Error consultando relaciones:", error);
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
}