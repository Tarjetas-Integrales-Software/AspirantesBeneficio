import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormGroup, FormsModule } from "@angular/forms"
import { DatosGeneralesComponent } from '../datos-generales/datos-generales.component';
import { Aspirantes } from "../../interfaces/aspirantes.interface";
import { AspirantesBeneficioService } from "../../../../services/CRUD/aspirantes-beneficio.service";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private aspirantesBeneficioService: AspirantesBeneficioService, private http: HttpClient) { }

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

  async uploadPhoto(imageData: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('fecha', new Date().toISOString());
    formData.append('tipo', 'foto_aspben');
    formData.append('id_aspirante_beneficio', '123456'); // Reemplazar con el ID real
    formData.append('curp', this.datosGeneralesComponent.myForm.get('curp')?.value);


    try {
      const response = await this.http.post('https://backmibeneficio.tisaweb.mx/api/v1/lic/aspben/registrar-foto', formData).toPromise();
      console.log('Foto subida exitosamente:', response);
    } catch (error) {
      console.error('Error al subir la foto:', error);
    }
  }

  public postWithFiles(data: any): Observable<any> {
    const formData = new FormData();
    formData.append('fecha', data.fecha);
    formData.append('tipo', data.tipo);
    formData.append('file', data.file);
    formData.append('id_aspirante_beneficio', data.id_aspirante_beneficio.toString());
    formData.append('curp', data.curp);

    return this.http.post('https://backmibeneficio.tisaweb.mx/api/v1/lic/aspben/registrar-foto', formData);
  }

  uploadFile(idAspiranteBeneficio: number): void {
    const formattedFecha = new Date().toISOString();

    const postData = {
      fecha: formattedFecha,
      tipo: 'foto_aspben',
      file: this.capturedImage,
      id_aspirante_beneficio: idAspiranteBeneficio,
      curp: this.datosGeneralesComponent.myForm.get('curp')?.value
    };

    this.postWithFiles(postData).subscribe(
      response => {
        console.log('Foto subida exitosamente:', response);
      },
      error => {
        console.error('Error al subir la foto:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.datosGeneralesComponent.myForm.valid) {
      this.datosGeneralesComponent.onSafe();

      if (this.capturedImage) {
        this.uploadPhoto(this.capturedImage).then(() => {
          console.log("Foto subida");
        }).catch((error) => {
          console.error("Error al subir la foto:", error);
        });
      }

      if (this.capturedImage) {
        this.datosGeneralesComponent.getMyForm().then((form) => {
          this.aspirantesBeneficioService.crearAspirante(form).then((response) => {
            console.log("Aspirante creado");
            this.uploadFile(response.id); // Subir la foto después de crear el aspirante
          }).catch((error) => {
            console.error("Error al crear aspirante:", error);
          });
        }).catch((error) => {
          console.error("Error al obtener el formulario:", error);
        });
      } else {
        console.log("No hay imagen capturada para subir");
      }

    } else {
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      console.log("Formulario no válido");
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
    this.submitForm.emit();
  }
}
