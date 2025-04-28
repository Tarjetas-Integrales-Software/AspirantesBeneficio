import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms"
import { HttpClient } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';
import { ImpresionManualService } from "./impresionManual.service";

const { ipcRenderer } = (window as any).require("electron");
@Component({
  selector: 'app-impresion-manual',
  imports: [CommonModule, FormsModule, ReactiveFormsModule , MatInputModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './impresionManual.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ImpresionManualComponent implements OnInit {
  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>

  @Input() disabledRegister: boolean = true;

  @Output() submitForm = new EventEmitter<void>();

  @Output() buttonClicked = new EventEmitter<void>();

  printers: any[] = [];
  selectedPrinterName: string = '';
  selectedPrinter: string = '';

  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  capturedImage = signal<string | null>(null)
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"

  formulario: FormGroup;

  constructor(private fb: FormBuilder, private impresionManualService: ImpresionManualService) {
    this.formulario = this.fb.group({
      nombreBeneficiario: ['', [Validators.required, Validators.minLength(1)]],
      curp: ['', [
        Validators.required,
        Validators.minLength(18),
        Validators.pattern(/^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/)
      ]],
      fechaExpedicion: [{ value: this.getFechaActual(), disabled: true }],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      noTarjeta: [null ,{ value: '', disabled: true }],
      foto: [null, ]
    });
  }

  getFechaActual(): string {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }

  async getFechaActualFormatoAñoMesDia(): Promise<string> {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }

  ngOnInit() {
    this.getAvailableCameras();
    this.getAvailablePrinters();
    this.getPrinters();
    this.formulario.get('noTarjeta')?.disable();
  }

  notifyParent() {
    this.buttonClicked.emit();
  }

  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.devices = devices.filter((device) => device.kind === "videoinput")
    } catch (error) {
      console.error("Error accessing media devices:", error)
    }
  }

  async getAvailablePrinters() {
    try {
      const printers = await ipcRenderer.invoke('get-printers');
      this.printers = printers;
      console.log("Available printers:", this.printers);
    } catch (error) {
      console.error("Error accessing printers:", error);
    }
  }

  async getPrinters() {
    this.printers = await ipcRenderer.invoke('get-printers');
    console.log(this.printers.length, 'printer-lenght');
    if (this.printers.length > 0) {
      // this.selectedPrinter = this.printers[0].name;
      console.log(this.printers, 'printers');
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
    // this.formulario.patchValue({ foto });
    const video = this.videoElement.nativeElement
    const canvas = this.canvas.nativeElement
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    // Convert to WebP if supported, otherwise fallback to JPEG
    if (this.imageFormat === "webp") {
      this.capturedImage.set(canvas.toDataURL("image/webp"))
      if (this.capturedImage() === "data:,") {
        // WebP is not supported, fallback to JPEG
        this.imageFormat = "jpeg"
        this.capturedImage.set(canvas.toDataURL("image/jpeg"))
      }
    } else {
      this.capturedImage.set(canvas.toDataURL("image/jpeg"))
    }

  }

  savePhoto(name: string, path: string) {
    if (this.capturedImage()) {
      ipcRenderer.send("save-image", this.capturedImage(), name, path);
    }
  }

  toggleImageFormat() {
    this.imageFormat = this.imageFormat === "webp" ? "jpeg" : "webp"
    if (this.capturedImage()) {
      this.capturePhoto() // Re-capture with new format-
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
          console.log(errorMessage);
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



  toUpperCaseName(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.formulario.get('nombreBeneficiario')?.setValue(input.value);
  }

  toUpperCaseCurp(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.formulario.get('curp')?.setValue(input.value);
  }


  async printManual() {
    if (this.formulario.valid) {
      const formData = this.formulario.value;
      const photoPath = this.capturedImage(); // Foto recién tomada
      try {
        ipcRenderer.send('print-id-card-manual', {
          ...formData,
          photoPath: photoPath,
          printer: this.selectedPrinter
        });

        // console.log('Datos enviados para impresión manual:', formData, 'foto', photoPath, 'printer', this.selectedPrinter);

        const aspirante = {
          nombreBeneficiario: formData.nombreBeneficiario,
          curp: formData.curp,
          telefono: formData.telefono,
          fechaExpedicion: '2025-04-28',
        }
        // Llamar al servicio para registrar la impresión
        this.impresionManualService.registerImpresion(aspirante).subscribe({
          next: (response) => {
            console.log('Registro de impresión exitoso:', response);
            Swal.fire({
              title: 'Impresión exitosa',
              text: 'La tarjeta se imprimió correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (error) => {
            console.error('Error al registrar la impresión:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo registrar la impresión.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });

      } catch (error) {
        console.error('Error al enviar los datos para impresión manual:', error);
      }
    } else {
      console.error('Formulario inválido, no se puede imprimir.');
    }
  }

  deleteImage() {
    this.capturedImage.set(null);
  }
}
