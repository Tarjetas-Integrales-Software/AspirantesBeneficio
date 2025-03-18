import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormGroup, FormsModule } from "@angular/forms"
import { DatosGeneralesComponent } from '../datos-generales/datos-generales.component';
import { AspirantesBeneficioService, Aspirante } from "../../../../services/CRUD/aspirantes-beneficio.service";
import { HttpClient } from '@angular/common/http';
import { FotosService } from "../../../../services/CRUD/fotos.service";
import { AspirantesBeneficioFotosService } from "../../../../services/CRUD/aspirantes-beneficio-fotos.service";
import Swal from 'sweetalert2';

const { ipcRenderer } = (window as any).require("electron");
@Component({
  selector: 'fotoComponent',
  imports: [CommonModule, FormsModule],
  templateUrl: './foto.component.html',
  styleUrl: './foto.component.scss'
})
export class FotoComponent implements OnInit {
  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>
  @Output() submitForm = new EventEmitter<void>();
  @Input() datosGeneralesComponent!: DatosGeneralesComponent;

  constructor(
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private http: HttpClient,
    private fotosService: FotosService,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService
  ) { }

  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  capturedImage: string | null = null
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"
  downloadPath = "C:/Users/DELL 540/AppData/Roaming/Aspirantes Beneficio/imagenesBeneficiarios"

  ngOnInit() {
    this.getAvailableCameras()
  }

  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.devices = devices.filter((device) => device.kind === "videoinput")
    } catch (error) {
      console.error("Error accessing media devices:", error)
    }
  }

  async startStream() {
    if (this.stream) {
      this.stopStream()
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: this.selectedDevice },
      })
      this.videoElement.nativeElement.srcObject = this.stream
    } catch (error) {
      console.error("Error accessing the camera:", error)
    }
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.videoElement.nativeElement.srcObject = null
  }

  async capturePhoto() {
    const video = this.videoElement.nativeElement
    const canvas = this.canvas.nativeElement
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    // Convert to WebP if supported, otherwise fallback to JPEG
    if (this.imageFormat === "webp") {
      this.capturedImage = canvas.toDataURL("image/webp")
      if (this.capturedImage === "data:,") {
        // WebP is not supported, fallback to JPEG
        this.imageFormat = "jpeg"
        this.capturedImage = canvas.toDataURL("image/jpeg")
      }
    } else {
      this.capturedImage = canvas.toDataURL("image/jpeg")
    }
  }

  savePhoto(name: string) {
    if (this.capturedImage) {
      ipcRenderer.send("save-image", this.capturedImage, name);
    }
  }

  toggleImageFormat() {
    this.imageFormat = this.imageFormat === "webp" ? "jpeg" : "webp"
    if (this.capturedImage) {
      this.capturePhoto() // Re-capture with new format
    }
  }

  mostrarErrores(form: FormGroup) {
    let errorMessages = '';
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      const controlErrors = control ? control.errors : null;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          const errorMessage = `Error en el control ${key}: ${keyError}, valor: ${controlErrors[keyError]}`;
          errorMessages += `${errorMessage}\n`;
        });
      }
    });

    if (errorMessages) {
      Swal.fire({
        title: 'Errores en el formulario',
        text: errorMessages,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  async uploadFile(): Promise<void> {
    const formattedFecha = new Date().toISOString();
    const curp = this.datosGeneralesComponent.myForm.get('curp')?.value;

    try {
      // Crear foto en la base de datos local
      await this.fotosService.crearFoto({
        id_status: 1, // Asignar el estado adecuado
        fecha: formattedFecha,
        tipo: 'foto_aspben',
        // archivo: this.capturedImage!,
        archivo: curp + '.webp',
        path: 'docsaspirantesbeneficio/' + curp + '.webp', // Asignar el path adecuado si es necesario
        archivoOriginal: `captured_photo.${this.imageFormat}`,
        extension: this.imageFormat,
        created_id: 0, // Asignar el ID adecuado si es necesario
        created_at: formattedFecha
      });
    } catch (error) {
      console.error('Error al guardar la foto en la base de datos local:', error);
    }
  }

  async onSubmit(): Promise<void> {
    // Detener el video de la cámara
    this.stopStream();

    // Verificamos si el formulario es válido
    if (this.datosGeneralesComponent.myForm.valid) {
      this.datosGeneralesComponent.onSafe();

      try {

        if (this.capturedImage) {
          const form: Aspirante = await this.datosGeneralesComponent.getMyForm();
          // Obtenemos los datos del formulario
          // Creamos el aspirante con los datos obtenidos del formulario
          await this.aspirantesBeneficioService.crearAspirante(form);
          // Subimos la foto del aspirante
          await this.uploadFile(); // Subir la foto después de crear el aspirante

          this.savePhoto(form.curp);
          // Obtenemos el último ID de la tabla de aspirantes y de la tabla de fotos
          const lastIdApirante = await this.aspirantesBeneficioService.getLastId() || 0;
          const lastIdFoto = await this.fotosService.getLastId() || 0;

          // Creamos la relación entre el aspirante y la foto
          await this.aspirantesBeneficioFotosService.crearRelacion({
            id_aspirante_beneficio: lastIdApirante,
            id_foto: lastIdFoto,
            id_status: 1,
            created_id: 0,
            created_at: ""
          });
          Swal.fire({
            title: 'Registro exitoso!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

          //borramos la foto y datos del formulario
          this.capturedImage = null;
          this.datosGeneralesComponent.myForm.reset();
          this.datosGeneralesComponent.myForm.markAsPristine();
          this.datosGeneralesComponent.disabledGradoCarrera();

        } else {
          console.log("No hay imagen capturada para subir");
        }
      } catch (error) {
        console.error("Error en el proceso:", error);
      }
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      // Mostrar los errores en la consola del formulario
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
    this.submitForm.emit();
  }

  async onEdit() {
    // Detener el video de la cámara
    this.stopStream();

    // Verificamos si el formulario es válido
    if (this.datosGeneralesComponent.myForm.valid) {
      const form: Aspirante = await this.datosGeneralesComponent.getMyFormEdit();
      try {
        const response = await this.aspirantesBeneficioService.editarAspirante(form);
        if (response.success) {
          Swal.fire({
            title: 'Actualización exitosa!',
            text: response.message,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            title: 'Error en la actualización',
            text: response.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      } catch (error) {
        console.error("Error en el proceso:", error);
        Swal.fire({
          title: 'Error en la actualización',
          text: 'Ocurrió un error al intentar actualizar el aspirante',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      // Mostrar los errores en la consola del formulario
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
  }
}
