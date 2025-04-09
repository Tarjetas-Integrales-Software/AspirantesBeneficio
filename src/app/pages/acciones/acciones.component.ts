import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AspirantesBeneficioFotosService } from "../../services/CRUD/aspirantes-beneficio-fotos.service";
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AccionesService } from "../../services/CRUD/acciones.service";
import { AspirantesBeneficioService } from "../../services/CRUD/aspirantes-beneficio.service";

@Component({
  selector: 'app-acciones',
  imports: [],
  templateUrl: './acciones.component.html',
  styleUrl: './acciones.component.scss'
})
export class AccionesComponent {

  curps_reenviar_a_tisa: any[] = [];

  constructor(

    private http: HttpClient,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private accionesService: AccionesService,
    private aspirantesBeneficioService: AspirantesBeneficioService

  ) { }


  getCurpsReenviarActivos(): void {
    this.accionesService.getCurpsReenviarActivos().subscribe({
      next: (response) => {
        this.curps_reenviar_a_tisa = response.data;
      },
      error: (error) => {
        console.error('Error al cargar todos los códigos postales:', error);
      }
    });
  }

  obtenerSoloCurps(arreglo: any[]): string[] {
    return arreglo.map(item => item.curp);
  }

  async obtenerIdsDeAspirantes(curps_reenviar_tisa: string[]): Promise<any[]> {
    const ids: any[] = [];

    // Itera sobre cada curp
    for (const curp of curps_reenviar_tisa) {
      const id = await this.aspirantesBeneficioService.consultarAspirantePorCurpDbLocal(curp);
      if (id) {
        ids.push(id);  // Si se encuentra el id, lo agregamos al arreglo
      }
    }

    return ids;
  }




  async onSubmit(): Promise<void> {
    try {


      // Consumir servicio para obtener las curps habilitadas para reenvio desde aspben hacia tisa
      this.getCurpsReenviarActivos();
      console.log(this.curps_reenviar_a_tisa,'curps_reenviar_a_tisa');

      // const curps_reeanviar_tisa: string[] = await this.obtenerSoloCurps(this.curps_reenviar_a_tisa);
      // console.log(curps_reeanviar_tisa,'curps_reeanviar_tisa');

      // // Obtener los id_aspirante_beneficio de las base local de las curps obtenidas anteriormente
      // // , en caso de existir en dicho equipo
      // const ids = await this.obtenerIdsDeAspirantes(curps_reeanviar_tisa);
      // console.log(ids,'ids');

      // // Iteracion por cada id_aspirante_beneficio para actualizar el campo confirmado = null en la relacion
      // // , para volver a realizar el intento de envio hacia TISA
      // for (const id of ids) {
      //   if (id) {
      //     await this.aspirantesBeneficioFotosService.actualizarConfirmadoPorIdAspiranteBeneficio(id);
      //   }
      // }

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
