import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AspirantesBeneficioFotosService } from "../../services/CRUD/aspirantes-beneficio-fotos.service";
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AccionesService } from "../../services/CRUD/acciones.service";
import { AspirantesBeneficioService } from "../../services/CRUD/aspirantes-beneficio.service";
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
const { ipcRenderer } = (window as any).require("electron");
import { StorageService } from "../../services/storage.service";

export interface cs_monitor_ejecucion_acciones {
  numero_serial?: string;
  usuario_ejecutando_app?: string;
  tipo_accion?: string;
  fecha_evento?: string;
  created_id?: number;
  created_at?: string;
}

@Component({
  selector: 'app-acciones',
  imports: [],
  templateUrl: './acciones.component.html',
  styleUrl: './acciones.component.scss'
})
export class AccionesComponent {

  curps_reenviar_a_tisa: any[] = [];
  isButtonDisabled = false;
  user: string = '';

  constructor(

    private http: HttpClient,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private accionesService: AccionesService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private storageService: StorageService,

  ) { }

   obtenerSoloCurps(arreglo: any[]): string[] {
    return arreglo.map(item => item.curp);

  }

  async obtenerIdsDeAspirantes(curps_reenviar_tisa: string[]): Promise<any[]> {
    const ids: number[] = [];

    // Itera sobre cada curp
    for (const curp of curps_reenviar_tisa) {
      const row = await this.aspirantesBeneficioService.consultarAspirantePorCurpDbLocal(curp);
      if (row && row.id !== undefined) {
      const idNumerico = Number(row.id);
        if (!isNaN(idNumerico)) {
          ids.push(idNumerico);
        } else {
          console.warn(`ID no numérico para CURP ${curp}:`, row.id);
        }
      } else {
        console.warn(`No se encontró ID para CURP ${curp}`);
      }
    }

    return ids;
  }

  async enviarMonitorEjecucionAccion(): Promise<void> {

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
        const obj_monitor_ejecucion_accion: cs_monitor_ejecucion_acciones = {
          numero_serial: serial_number,
          usuario_ejecutando_app: usuario,
          tipo_accion: 'Reenvio Curps TISA',
          fecha_evento: fecha_actual

        }

        // enviar todo por medio de un servicio a TISA
        this.accionesService.registrarMonitorEjecucionAcciones(obj_monitor_ejecucion_accion).subscribe({
          next: ((response) => {
            console.log("Se sincronizo la informacion de monitor equipos");
          }),
          error: ((error) => { })
        });
      } catch (error) {
        console.error("Error en sendInfo_MonitorEquipo: ", error);
      }

    }


  async onSubmit(event: Event): Promise<void> {

    event.preventDefault();
    this.isButtonDisabled = true;

    try {

      // Consumir servicio para obtener las curps habilitadas para reenvio desde aspben hacia tisa
      const curps_reenviar = await this.accionesService.getCurpsReenviarActivos();
      this.curps_reenviar_a_tisa = curps_reenviar.data;
      console.log(this.curps_reenviar_a_tisa, 'curps_reenviar');

      // Obtener un arreglo de curps solamente
      const arr_curps_reeanviar_tisa: string[] = this.obtenerSoloCurps(this.curps_reenviar_a_tisa);
      console.log(arr_curps_reeanviar_tisa,'arr_curps_reeanviar_tisa');


      // Obtener los id_aspirante_beneficio de las base local de las curps obtenidas anteriormente, en caso de existir en dicho equipo
      const ids: number[] = await this.obtenerIdsDeAspirantes(arr_curps_reeanviar_tisa);
      console.log(ids,'ids');

      const idsFiltrados = ids.filter(id => typeof id === 'number' && !isNaN(id));
      console.log(idsFiltrados,'idsFiltrados');

      // Iteracion por cada id_aspirante_beneficio para actualizar el campo confirmado = null en la relacion para volver a realizar el intento de envio hacia TISA
      for (const id of idsFiltrados) {
        if (id) {

          //Obtener la curp del id de aspirante actual
          let curp_actual = await this.aspirantesBeneficioService.consultarAspirantePorId(id);
          console.log(curp_actual,'curp_actual');

          // se actualiza en TISA el campo encontrada, para saber cuales si se enviaran o se debieron haber enviado
          this.accionesService.updateCurpEncontrada(curp_actual.curp).subscribe({
            next: (response) => {
              console.log("update encontrada " + curp_actual);
            },
            error: (error) => {
              console.error("Error al crear aspirante:", error);
            }
          });

          // actualiza el registro de relacion en el campo confirmado = null, para su reenvio
          await this.aspirantesBeneficioFotosService.actualizarConfirmadoPorIdAspiranteBeneficio(id);
        }
      }

      // enviar monitor ejecucion acciones
      await this.enviarMonitorEjecucionAccion();

      Swal.fire({
        title: 'Accion Realizada Exitosamente!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error en el proceso:", error);
    }

  }



}
