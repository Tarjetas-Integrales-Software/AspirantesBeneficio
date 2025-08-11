import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, signal, inject, ChangeDetectorRef } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms"
import { HttpClient } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';
import { ImpresionManualService } from "./impresionManual.service";
import { ConfiguracionesService } from "../../services/CRUD/configuraciones.service";
import { Router } from "@angular/router";

interface Printer {
  name: string;
  displayName: string;
  description?: string;
  status: number;
  isDefault: boolean;
}

@Component({
  selector: 'app-impresion-manual',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './impresionManual.component.html',
  styleUrl: './impresionManual.component.scss',
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
  selectedPrinter = signal<string | null>(null);
  disenoSeleccionado: string = "";

  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  capturedImage = signal<string | null>(null)
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"
  modulo_actual: string | null = null;

  formulario: FormGroup;
  formZapopan: FormGroup;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private impresionManualService: ImpresionManualService,
    private configuracionesService: ConfiguracionesService
  ) {
    this.formulario = this.fb.group({
      nombreBeneficiario: ['', [Validators.required, Validators.minLength(4)]],
      curp: ['', [
        Validators.required,
        Validators.minLength(18),
        Validators.pattern(/^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/)
      ]],
      fechaExpedicion: [{ value: this.getFechaActual(), disabled: true }],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      noTarjeta: [null, { value: '', disabled: true }],
      foto: [null,]
    });

    this.formZapopan = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      curp: ['', [
        Validators.required,
        Validators.minLength(18),
        Validators.pattern(/^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/)
      ]],
    })
  }

  private router = inject(Router);

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo teclas numéricas (0-9)
    return (charCode >= 48 && charCode <= 57);
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
    return `${anio}-${mes}-${dia}`;
  }

  ngOnInit() {
    this.modulo_actual = this.configuracionesService.getSelectedValueModu();
    if (!this.modulo_actual) {
      let timerInterval: NodeJS.Timeout;
      Swal.fire({
        icon: 'info',
        title: 'Aún no seleccionás un módulo...',
        html: 'Por favor, seleccioné un módulo y vuelva a intentar <br> Redirigiendo en <b></b> segundos.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const container = Swal.getHtmlContainer();
          if (!container) return; // Verifica que no sea null
          const b = container.querySelector('b') as HTMLElement | null;
          if (!b) return; // Verifica que 'b' exista

          timerInterval = setInterval(() => {
            const timerLeft = Swal.getTimerLeft(); // Puede ser undefined
            if (typeof timerLeft === 'number') { // Verifica si es un número
              b.textContent = Math.ceil(timerLeft / 1000).toString();
            }
          }, 1000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
          this.router.navigateByUrl('/inicio/modulo-operaciones');
        }
      });
    }
    this.getAvailableCameras();
    this.getAvailablePrinters();
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

  async getAvailablePrinters(): Promise<Printer[]> {
    if (!window.electronAPI) {
      console.warn('Electron API no disponible - Modo navegador');
      return []; // Fallback para desarrollo
    }

    try {
      this.printers = await window.electronAPI.getPrinters();

      if (this.printers.length > 0) {
        console.log('Impresoras disponibles:', this.printers);
      } else {
        console.warn('No se encontraron impresoras');
      }

      return this.printers;
    } catch (error) {
      console.error('Error al obtener impresoras:', error);
      return []; // Fallback seguro
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

  savePhoto(name: string, path: string): void {
    if (!this.capturedImage() || this.capturedImage() === null) {
      console.warn('No hay imagen capturada para guardar');
      return;
    }

    if (!window.electronAPI) {
      console.error('Electron API no disponible');
      return;
    }

    try {
      window.electronAPI.savePhoto(this.capturedImage() as string, name, path);
    } catch (error) {
      console.error('Error al enviar imagen para guardar:', error);
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
        // console.log('Datos enviados para impresión manual:', formData, 'foto', photoPath, 'printer', this.selectedPrinter);
        this.modulo_actual = this.configuracionesService.getSelectedValueModu();
        const fechaExpedicion = await this.getFechaActualFormatoAñoMesDia();

        const aspirante = {
          nombreBeneficiario: formData.nombreBeneficiario,
          curp: formData.curp,
          telefono: formData.telefono,
          fechaExpedicion: fechaExpedicion || this.formulario.get('fechaExpedicion')?.value,
          modulo: this.modulo_actual,
        }

        if (!window.electronAPI) {
          throw new Error('Funcionalidad de impresión solo disponible en Electron');
        }

        try {
          const printer = this.selectedPrinter(); // Tu método para obtener la impresora seleccionada

          if (!printer) {
            throw new Error('No se ha seleccionado ninguna impresora');
          }

          await window.electronAPI.printIdCard({
            ...aspirante,
            photoPath: photoPath || '',
            printer: printer
          }, true);

          console.log('Impresión de carnet iniciada correctamente');
        } catch (error) {
          console.error('Error al imprimir carnet:', error);
          throw error; // Relanzar para manejo en el componente
        }

        // Llamar al servicio para registrar la impresión
        this.impresionManualService.registerImpresion(
          {
            ...aspirante,
            fechaExpedicion: fechaExpedicion,
          }
        ).subscribe({
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

        this.formulario.reset();
        this.capturedImage.set(null);
        this.stopStream();

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

  async seleccionarDiseno() {
    const { value: disenoSeleccionado } = await Swal.fire({
      title: 'Selecciona un diseño',
      input: 'select',
      inputOptions: {
        'null': '- Selecciona una opción -',
        yoJalisco: 'Yo Jalisco',
        zapopan: 'Zapopan',
      },
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value !== "null") {
            resolve();
          } else {
            resolve("Debes seleccionar un diseño");
          }
        });
      },
      icon: 'question',
      confirmButtonText: 'Seleccionar'
    });

    this.disenoSeleccionado = disenoSeleccionado;
    this.cdr.detectChanges();
  }
}
