import { Component, OnInit, ViewChild, ElementRef, inject, Output, EventEmitter } from "@angular/core"
import { MatDividerModule } from '@angular/material/divider';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from "@angular/common"
import { Validators,FormsModule,ReactiveFormsModule,FormGroup,FormBuilder, } from "@angular/forms"
import { get } from "http";
import { ConfiguracionesService } from "../../services/CRUD/configuraciones.service";


@Component({
  selector: 'app-configuraciones',
  imports: [
        MatDividerModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        //MatInput,
        MatDatepickerModule,
  ],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.scss'
})
export class ConfiguracionesComponent implements OnInit {
  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>
  @Output() submitForm = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  constructor(private configuracionesService: ConfiguracionesService) { }

  myForm: FormGroup = this.fb.group({
    id_formato_imagen: ['', []],
  })


  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"

  formatos_imagen: any[] = [];
  selectedValue_formatoimagen: string = ''; //formato de imagen seleccionada




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


  isValidField(fieldName: string): boolean | null {
    return (this.myForm.controls[fieldName].errors && this.myForm.controls[fieldName].touched);
  }

  getFieldError(fieldName: string): string | null {
    if (!this.myForm.controls[fieldName].errors) return null;

    const errors = this.myForm.controls[fieldName].errors ?? {};

    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es requerido';
        case 'email':
          return 'El email no es válido';
        case 'minlength':
          return `Este campo debe tener al menos ${errors[key].requiredLength} caracteres`;
      }
    }
    return null;
  }

  onSubmit(): void {

  }

}
