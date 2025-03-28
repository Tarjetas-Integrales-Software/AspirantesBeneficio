import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { StorageService } from './services/storage.service';
import { NetworkStatusService } from './services/network-status.service';
import { AspirantesBeneficioService } from './services/CRUD/aspirantes-beneficio.service';
import { FotosService } from './services/CRUD/fotos.service';
import { AspirantesBeneficioFotosService } from './services/CRUD/aspirantes-beneficio-fotos.service';
import { RelacionAsistenciaFotosService } from './services/CRUD/relacion-asistencia-fotos.service';
import { AsistenciaService } from './services/CRUD/asistencia.service';
import { CajerosFotosService } from './services/CRUD/cajeros-fotos.service';
import { CurpsRegistradasService } from './services/CRUD/curps-registradas.service';
import { AspirantesBeneficioDocumentosService } from './services/CRUD/aspirantes-beneficio-documentos.service';
import { DocumentosService } from './services/CRUD/documentos.service';

import { interval, Subscription } from 'rxjs';
import { switchMap, filter, take } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { GeolocationService } from './services/geolocation.service';
import { MonitorEquiposService } from './services/CRUD/monitor-equipos.service';
const { ipcRenderer } = (window as any).require("electron");
import { cs_monitor_equipos } from './services/CRUD/monitor-equipos.service';

interface Location {
  lat: number;
  lng: number;
}

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

  user: string = '';
  currentLocation: Location = { lat: 0, lng: 0 }; // Inicializamos con valores por defecto
  //currentLocation: { lat: number; lng: number } | null = null;

  constructor(
    private storageService: StorageService,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private fotosService: FotosService,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private relacionAsistenciaFotosService: RelacionAsistenciaFotosService,
    private asistenciaService: AsistenciaService,
    private cajerosFotosService: CajerosFotosService,
    private curpsRegistradasService: CurpsRegistradasService,
    private geoService: GeolocationService,
    private monitorEquipoService: MonitorEquiposService,
    private relacionAsistenciaFotosService: RelacionAsistenciaFotosService,
    private asistenciaService: AsistenciaService,
    private cajerosFotosService: CajerosFotosService,
    private aspirantesBeneficioDocumentosService: AspirantesBeneficioDocumentosService,
    private documentosService: DocumentosService
  ) { }

  ngOnInit(): void {
    this.checkAndSyncAspirantes();
    this.checkAndSyncCurps();
    this.checkAndSyncMonitorEquipo();
    this.checkAndSyncAsistencias();

    this.startSyncAspirantesInterval();
    this.startSyncDocumentosInterval();
    this.startSyncCurpInterval();

    this.sendInfo_MonitorEquipo();
    this.startSyncAsistenciaInterval();
  }

  ngOnDestroy(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  private checkAndSyncAspirantes(): void {
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

  private checkAndSyncAsistencias(): void {
    this.networkStatusService.isOnline.pipe(
      take(1),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarAsistencias();
    });
  }

  private checkAndSyncMonitorEquipo(): void {
    this.networkStatusService.isOnline.pipe(
      take(1),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.startSyncMonitorEquipoInterval();
    });
  }

  private startSyncAspirantesInterval(): void {
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
    this.syncSubscription = interval(environment.syncCurpInterval).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarCurps();
      this.syncAspirantesBeneficioDocumento();
      this.validarSincronizacionCompleta(); //EMD
    });
  }

  private startSyncAsistenciaInterval(): void {
    this.syncSubscription = interval(environment.syncAsistenciaInterval).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarAsistencias();
    });
  }

  private startSyncMonitorEquipoInterval(): void {
    this.syncSubscription = interval(environment.syncMonitorInterval).pipe(
      switchMap(() => this.networkStatusService.isOnline),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.sendInfo_MonitorEquipo();
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

          // Verificamos que los IDs sean números válidos antes de crear la relación
          if (typeof nuevoAspirante.id === "number" && typeof nuevoIdDocumento === "number") {
            const nuevaRelacion = {
              id_aspirante_beneficio: nuevoAspirante!.id,
              id_documento: nuevoIdDocumento
            };

            this.aspirantesBeneficioDocumentosService.createRelacion(nuevaRelacion).subscribe({
              next: (response) => {
                if (response.response) {
                  this.aspirantesBeneficioDocumentosService.eliminarRelacion(relacion.id);

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
                this.eliminarRelacionadosAspirante(nuevoIdAspirante, nuevoIdFoto);

                console.error("Error al crear relación:", error);
              }
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");

            this.eliminarRelacionadosAspirante(nuevoIdAspirante, nuevoIdFoto);
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
    if (items.length > 0) return this.aspirantesBeneficioFotosService.updateSyncStatus(false);
    else return this.aspirantesBeneficioFotosService.updateSyncStatus(true);
  }

  actualizarCurps(): void {
    this.curpsRegistradasService.getCurpsRegistradas().subscribe({
      next: ((response) => {
        this.curpsRegistradasService.syncLocalDataBase(response.data)
      }),
      error: ((error) => { })
    });
  }

  async actualizarAsistencias(): Promise<void> {
    try {
      const items = await this.relacionAsistenciaFotosService.consultarRelacionesDesincronizadas();

      for (const relacion of items) {
        const { id_asistencia, id_cajero_foto } = relacion;

        try {
          const asistencia = await this.asistenciaService.consultarAsistenciaPorId(id_asistencia);
          const foto = await this.cajerosFotosService.consultarFotoPorId(id_cajero_foto);

          let nuevaAsistencia = {};
          let nuevaFoto = {};
          let nuevoIdAsistencia: number | null = null;
          let nuevoIdFoto: number | null = null;

          // Crear aspirante y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.asistenciaService.createAsistencia(asistencia).subscribe({
              next: async (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdAsistencia = response.data.id;
                  nuevaAsistencia = response.data;
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
            this.cajerosFotosService.createFoto(foto).subscribe({
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
          if (typeof nuevoIdAsistencia === "number" && typeof nuevoIdFoto === "number") {
            const nuevaRelacion = {
              id_asistencia: nuevoIdAsistencia,
              id_cajero_foto: nuevoIdFoto
            };

            this.relacionAsistenciaFotosService.createRelacion(nuevaRelacion).subscribe({
              next: (response) => {
                if (response.response) {
                  this.relacionAsistenciaFotosService.eliminarRelacion(relacion.id);

                  this.cajerosFotosService.registerPhoto(nuevaAsistencia, nuevaFoto)
                }
              },
              error: (error) => {
                this.eliminarRelacionadosAspirante(nuevoIdAsistencia, nuevoIdFoto);

                console.error("Error al crear relación:", error);
              }
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");

            this.eliminarRelacionadosAspirante(nuevoIdAsistencia, nuevoIdFoto);
          }
        } catch (error) {
          console.error("Error obteniendo aspirante o foto:", error);
        }
      }
    } catch (error) {
      console.error("Error consultando relaciones:", error);
    }
  }

  eliminarRelacionadosAspirante(nuevoIdAspirante: null | number, nuevoIdFoto: null | number): void {
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

  eliminarRelacionadosAsistencia(nuevoIdAsistencia: null | number, nuevoIdFoto: null | number): void {
    if (typeof nuevoIdAsistencia === "number") this.asistenciaService.deleteAsistencia(nuevoIdAsistencia).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdAsistencia = null;
      },
      error: (error) => {
        console.error("Error al eliminar asistencia:", error);
      }
    });

    if (typeof nuevoIdFoto === "number") this.cajerosFotosService.deleteFoto(nuevoIdFoto).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdFoto = null;
      },
      error: (error) => {
        console.error("Error al eliminar asistencia:", error);
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

  async sendInfo_MonitorEquipo(): Promise<void> {

    try {

      // obtener la version de la aplicacion desde enviroment
      const app_version_actual = environment.gitversion;

      // obtener el serial number desde un metodo en main.js
      let serial_number = await ipcRenderer.invoke("get-serial-number");

      // obtener el usuario logueado desde el storage
      let usuario = '';
      let usuario_activo = '';

      if (this.storageService.exists("user")) {
        const user = this.storageService.get("user");
        this.user = user.email; //nombre del usuario

        usuario = this.user;
        usuario_activo = '1';
      } else {
        usuario = '';
        usuario_activo = '0';
      }

      let fecha = new Date();
      fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset()); // Ajusta a la zona horaria local
      let fecha_actual = fecha.toISOString().replace('T', ' ').substring(0, 19).padEnd(23, '.000');

      //construir el objeto
      const obj_monitor_equipos: cs_monitor_equipos = {
        numero_serial: serial_number,
        version_instalada: app_version_actual,
        app_en_ejecucion: usuario_activo,
        usuario_ejecutando_app: usuario,
        lat: '', //latitud.toString(),
        lng: '',//longitud.toString(),
        fecha_evento: fecha_actual

      }

      // enviar todo por medio de un servicio a TISA
      this.monitorEquipoService.registrarMonitorEquipo(obj_monitor_equipos).subscribe({
        next: ((response) => {
          console.log("Se sincronizo la informacion de monitor equipos");
        }),
        error: ((error) => { })
      });
    } catch (error) {
      console.error("Error en sendInfo_MonitorEquipo: ", error);
    }

  }
}
