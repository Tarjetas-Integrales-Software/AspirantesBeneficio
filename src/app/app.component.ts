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

  constructor(
    private storageService: StorageService,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private fotosService: FotosService,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private curpsRegistradasService: CurpsRegistradasService,
    private geoService: GeolocationService,
    private monitorEquipoService: MonitorEquiposService
  ) { }

  ngOnInit(): void {
    this.checkAndSync();
    this.checkAndSyncCurps();

    this.startSyncInterval();
    this.startSyncCurpInterval();

    this.sendInfo_MonitorEquipo();
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
      console.log("No se ha sincronizado todo");
      return this.aspirantesBeneficioFotosService.updateSyncStatus(false);
    }else{
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

  //PROCESO DE MONITOR EQUIPO

  async sendInfo_MonitorEquipo(): Promise<void>{

    try {

      // obtener la version de la aplicacion desde enviroment
      const app_version_actual = environment.gitversion;

      // obtener el serial number desde un metodo en main.js
      const serial_number = await ipcRenderer.send("get-serial-number");

      // obtener el usuario logueado desde el storage
      let usuario = '';
      let usuario_activo = '';

      if (this.storageService.exists("user")) {
        const user = this.storageService.get("user");
        this.user = user.email; //nombre del usuario

        usuario = this.user;
        usuario_activo = '1';
      }else{
        usuario = '';
        usuario_activo = '0';
      }

      // Obtener la geo localizacion actual
      this.geoService.getCurrentLocation().then(location => {
        this.currentLocation = location; // Asignamos la ubicación obtenida
        console.log('Ubicación obtenida:', this.currentLocation);
      }).catch(error => console.error('Error obteniendo ubicación:', error));

      const {lat: latitud,lng: longitud} = this.currentLocation;

      let fecha_actual = new Date().toISOString().replace('T', ' ').substring(0, 19).padEnd(23, '.000');


      //construir el objeto
      const obj_monitor_equipos: cs_monitor_equipos = {
        numero_serial: serial_number,
        version_instalada: app_version_actual,
        app_en_ejecucion: usuario_activo,
        usuario_ejecutando_app: usuario,
        lat: latitud.toString(),
        lng: longitud.toString(),
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
