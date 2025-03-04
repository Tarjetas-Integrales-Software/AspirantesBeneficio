import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormGroup, FormsModule } from "@angular/forms"
import { DatosGeneralesComponent } from '../datos-generales/datos-generales.component';
import { Aspirantes } from "../../interfaces/aspirantes.interface";
import { AspirantesBeneficioService } from "../../../../services/CRUD/aspirantes-beneficio.service";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FotosService } from "../../../../services/CRUD/fotos.service";
import { AspirantesBeneficioFotosService } from "../../../../services/CRUD/aspirantes-beneficio-fotos.service";

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

  capturePhoto() {
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

  downloadPhoto() {
    if (this.capturedImage) {
      const link = document.createElement("a")
      link.href = this.capturedImage
      link.download = `captured_photo.${this.imageFormat}`
      link.click()
    }
  }

  toggleImageFormat() {
    this.imageFormat = this.imageFormat === "webp" ? "jpeg" : "webp"
    if (this.capturedImage) {
      this.capturePhoto() // Re-capture with new format
    }
  }

  mostrarErrores(form: FormGroup) {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      const controlErrors = control ? control.errors : null;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          console.log('Error en el control ' + key + ': ' + keyError + ', valor: ', controlErrors[keyError]);
        });
      }
    });
  }

  // async uploadPhoto(imageData: string): Promise<void> {
  //   const formData = new FormData();
  //   formData.append('file', imageData);
  //   formData.append('fecha', new Date().toISOString());
  //   formData.append('tipo', 'foto_aspben');
  //   formData.append('id_aspirante_beneficio', '123456'); // Reemplazar con el ID real
  //   formData.append('curp', this.datosGeneralesComponent.myForm.get('curp')?.value);


  //   try {
  //     const response = await this.http.post('https://backmibeneficio.tisaweb.mx/api/v1/lic/aspben/registrar-foto', formData).toPromise();
  //     console.log('Foto subida exitosamente:', response);
  //   } catch (error) {
  //     console.error('Error al subir la foto:', error);
  //   }
  // }

  // async postWithFiles(data: any, id: number): Promise<Observable<any>> {

  //   let lastId = await this.fotosService.getLastId() || 0;
  //   console.log('LAST ID BEFORE:', lastId);
  //   lastId += 1;
  //   console.log('LAST ID AFTER:', lastId);

  //   console.log('Data:', data);
  //   const formData = new FormData();
  //   formData.append('fecha', data.fecha);
  //   formData.append('tipo', data.tipo);
  //   formData.append('file', data.file);
  //   formData.append('id_aspirante_beneficio', lastId.toString());
  //   if (data.id_aspirante_beneficio !== undefined) {
  //   }
  //   formData.append('curp', data.curp);

  //   return this.http.post('https://backmibeneficio.tisaweb.mx/api/v1/lic/aspben/registrar-foto', formData);
  // }

  async uploadFile(): Promise<void> {
    const formattedFecha = new Date().toISOString();
    const path = 'docsbeneficiarios/' + this.datosGeneralesComponent.myForm.get('curp')?.value;

    try {
      // Crear foto en la base de datos local
      await this.fotosService.crearFoto({
        id_status: 1, // Asignar el estado adecuado
        fecha: formattedFecha,
        tipo: 'foto_aspben',
        archivo: this.capturedImage!,
        path: path, // Asignar el path adecuado si es necesario
        archivoOriginal: `captured_photo.${this.imageFormat}`,
        extension: this.imageFormat,
        created_id: 0, // Asignar el ID adecuado si es necesario
        created_at: formattedFecha
      });
      console.log('Foto guardada en la base de datos local');
    } catch (error) {
      console.error('Error al guardar la foto en la base de datos local:', error);
    }
  }

  async onSubmit(): Promise<void> {
    // Verificamos si el formulario es válido
    if (this.datosGeneralesComponent.myForm.valid) {
      this.datosGeneralesComponent.onSafe();

      try {

        if (this.capturedImage) {
          // Obtenemos los datos del formulario
          const form = await this.datosGeneralesComponent.getMyForm();
          // Creamos el aspirante con los datos obtenidos del formulario
          await this.aspirantesBeneficioService.crearAspirante(form);
          console.log("Aspirante creado");
          // Subimos la foto del aspirante
          await this.uploadFile(); // Subir la foto después de crear el aspirante

          // Obtenemos el último ID de la tabla de aspirantes y de la tabla de fotos
          const lastIdApirante = await this.aspirantesBeneficioService.getLastId() || 0;
          const lastIdFoto = await this.fotosService.getLastId() || 0;
          console.log('lastIdApirante', lastIdApirante, 'lastIdFoto', lastIdFoto);

          // Creamos la relación entre el aspirante y la foto
          await this.aspirantesBeneficioFotosService.crearRelacion({
            id_aspirante_beneficio: lastIdApirante,
            id_foto: lastIdFoto,
            id_status: 1,
            created_id: 0,
            created_at: ""
          });
          console.log("Relación guardada");

          //borramos la foto y datos del formulario
          this.capturedImage = null;
          this.datosGeneralesComponent.myForm.reset();
          this.datosGeneralesComponent.myForm.get('estado')?.setValue('Jalisco');
          this.datosGeneralesComponent.myForm.markAsPristine();


        } else {
          console.log("No hay imagen capturada para subir");
        }
      } catch (error) {
        console.error("Error en el proceso:", error);
      }
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      console.log("Formulario no válido");
      // Mostrar los errores en la consola del formulario
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
    this.submitForm.emit();
  }
}
