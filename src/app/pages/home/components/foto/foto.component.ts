import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormGroup, FormsModule } from "@angular/forms"
import { DatosGeneralesComponent } from '../datos-generales/datos-generales.component';
import { AspirantesBeneficioService } from "../../../../services/CRUD/aspirantes-beneficio.service";

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

  constructor(private aspirantesBeneficioService: AspirantesBeneficioService) { }

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

  onSubmit(): void {
    if (this.datosGeneralesComponent.myForm.valid) {
      this.datosGeneralesComponent.onSafe();

      this.datosGeneralesComponent.getMyForm().then((form) => {
        this.aspirantesBeneficioService.crearAspirante(form).then(() => {
          this.savePhoto(form.curp);
          console.log("Aspirante creado");
        }).catch((error) => {
          console.error("Error al crear aspirante:", error);
        });
      }).catch((error) => {
        console.error("Error al obtener el formulario:", error);
      });

    } else {
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      console.log("Formulario no válido");
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
    this.submitForm.emit();
  }
}
