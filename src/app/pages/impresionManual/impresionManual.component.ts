import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormGroup, FormsModule } from '@angular/forms';
const { ipcRenderer } = (window as any).require("electron");

@Component({
  selector: 'app-impresion-manual',
  imports: [FormsModule],
  templateUrl: './impresionManual.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpresionManualComponent implements OnInit {

  constructor(
    private http: HttpClient,
  ) { }

  private router = inject(Router);

  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>

  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  capturedImage: string | null = null
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"
  imgFoto = signal<string | null>(null);

  documentFileLoaded: boolean = false;
  lblUploadingFile: string = '';
  documentFile: any = {
    file: '',
    archivos: []
  }
  habilitarSubirDocumento: string = '';

  ngOnInit() {
    this.getAvailableCameras()

  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.lblUploadingFile = file.name;
      this.documentFile.file = file;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
      this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado
    } else {
      Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
      this.lblUploadingFile = '';
      this.documentFile.file = null;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(null); // Eliminar esta línea
      this.documentFileLoaded = false; // Marcar que no hay archivo cargado
    }
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
      ipcRenderer.send("save-image", this.capturedImage, name, 'imagenesBeneficiarios');
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


  async onSubmit(): Promise<void> {
  }
}
