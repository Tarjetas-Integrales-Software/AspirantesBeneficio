import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AspirantesBeneficioFotosService } from "../../services/CRUD/aspirantes-beneficio-fotos.service";
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AccionesService } from "../../services/CRUD/acciones.service";
import { AspirantesBeneficioService } from "../../services/CRUD/aspirantes-beneficio.service";
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-acciones',
  imports: [],
  templateUrl: './acciones.component.html',
  styleUrl: './acciones.component.scss'
})
export class AccionesComponent {

  curps_reenviar_a_tisa: any[] = [];
  isButtonDisabled = false;

  constructor(

    private http: HttpClient,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private accionesService: AccionesService,
    private aspirantesBeneficioService: AspirantesBeneficioService

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
