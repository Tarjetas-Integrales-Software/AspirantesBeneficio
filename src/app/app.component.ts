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
import { AspirantesBeneficioDocumentosService } from './services/CRUD/aspirantes-beneficio-documentos.service';
import { DocumentosService } from './services/CRUD/documentos.service';

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
    private curpsRegistradasService: CurpsRegistradasService,
    private aspirantesBeneficioDocumentosService: AspirantesBeneficioDocumentosService,
    private documentosService: DocumentosService
  ) { }

  ngOnInit(): void {
    this.checkAndSync();
    this.checkAndSyncCurps();

    this.startSyncInterval();
    this.startSyncDocumentosInterval();
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

  private startSyncDocumentosInterval(): void {
    this.syncSubscription = interval(60000).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.syncAspirantesBeneficioDocumento();
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

  async syncAspirantesBeneficioDocumento(): Promise<void> {
    try {
      const items = await this.aspirantesBeneficioDocumentosService.consultarRelacionesDesincronizadas();

      for (const relacion of items) {
        const { id_aspirante_beneficio, id_documento } = relacion;

        try {

          const documento = await this.documentosService.consultarDocumentoPorId(id_documento);
          // Obtener la curp del aspirante
          const { curp } = await this.aspirantesBeneficioService.consultarAspirantePorId(id_aspirante_beneficio);

          const nuevoAspiranteResponse = await this.aspirantesBeneficioService.consultarAspirantePorCurp(curp).toPromise();

          const nuevoAspirante = nuevoAspiranteResponse!.data[0] || {};
          
          let nuevoDocumento = {};
          let nuevoIdDocumento: number | null = null;
          
          // Crear documento y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.documentosService.createDocumento(documento).subscribe({ // falta crear la base de datos de documentos en el backend
              next: async (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdDocumento = response.data.id;
                  nuevoDocumento = response.data;
                  console.log("Documento creado:");
                }
                
                resolve();
              },
              error: (error) => {
                console.error("Error al crear documento:", error);
                reject(error);
              }
            });
          });

          console.log("Nuevo id Aspirante:", nuevoAspirante.id, "Nuevo id Documento:", nuevoIdDocumento);
        
          // Verificamos que los IDs sean números válidos antes de crear la relación 
          if (typeof nuevoAspirante.id === "number" && typeof nuevoIdDocumento === "number") {
            const nuevaRelacion = {
              id_aspirante_beneficio: nuevoAspirante!.id,
              id_documento: nuevoIdDocumento
            };

            this.aspirantesBeneficioDocumentosService.createRelacion(nuevaRelacion).subscribe({ // falta crear la base de datos de la relación de documentos con aspirantes en el backend
              next: (response) => {
                if (response.response) {
                  this.aspirantesBeneficioDocumentosService.eliminarRelacion(relacion.id);

                  console.log("Relación creada y archivo subido:");

                  this.documentosService.registerDocumento(nuevoAspirante, nuevoDocumento)
                }
              },
              error: (error) => {
                this.eliminarRelacionadosDocumento(nuevoAspirante.id, nuevoIdDocumento);

                console.error("Error al crear relación:", error);
              }
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");

            this.eliminarRelacionadosDocumento(nuevoAspirante.id, nuevoIdDocumento);
          }

        } catch (error) {
          console.error("Error obteniendo aspirante o documento:", error);
        }
      }
    } catch (error) {
      console.error("Error consultando relaciones:", error);
    }
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

  async validarSincronizacionCompleta(): Promise<void> {
    const items = await this.aspirantesBeneficioFotosService.consultarRelacionesDesincronizadas();
    if (items.length > 0) {
      console.log("No se ha sincronizado todo");
      return this.aspirantesBeneficioFotosService.updateSyncStatus(false);
    } else {
      console.log("Se ha sincronizado");
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

  eliminarRelacionadosDocumento(nuevoIdAspirante: null | number, nuevoIdDocumento: null | number): void {
    if (typeof nuevoIdAspirante === "number") this.aspirantesBeneficioService.deleteAspiranteBeneficio(nuevoIdAspirante).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdAspirante = null;
      },
      error: (error) => {
        console.error("Error al crear aspirante:", error);
      }
    });

    if (typeof nuevoIdDocumento === "number") this.documentosService.deleteDocumento(nuevoIdDocumento).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdDocumento = null;
      },
      error: (error) => {
        console.error("Error al crear aspirante:", error);
      }
    });
  }
}
