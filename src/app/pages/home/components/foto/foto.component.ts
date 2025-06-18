import { Component, type OnInit, ViewChild, type ElementRef, Input, Output, EventEmitter, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormGroup, FormsModule } from "@angular/forms"
import { DatosGeneralesComponent } from '../datos-generales/datos-generales.component';
import { AspirantesBeneficioService, Aspirante } from "../../../../services/CRUD/aspirantes-beneficio.service";
import { HttpClient } from '@angular/common/http';
import { FotosService } from "../../../../services/CRUD/fotos.service";
import { AspirantesBeneficioFotosService } from "../../../../services/CRUD/aspirantes-beneficio-fotos.service";
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from "@angular/router";
import { switchMap } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DocumentosService } from "../../../../services/CRUD/documentos.service";
import { AspirantesBeneficioDocumentosService } from "../../../../services/CRUD/aspirantes-beneficio-documentos.service";

@Component({
  selector: 'fotoComponent',
  imports: [CommonModule, FormsModule, MatCheckboxModule],
  templateUrl: './foto.component.html',
  styleUrl: './foto.component.scss'
})
export class FotoComponent implements OnInit {
  @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>
  @ViewChild("canvas") canvas!: ElementRef<HTMLCanvasElement>
  @Output() submitForm = new EventEmitter<void>();
  @Input() datosGeneralesComponent?: DatosGeneralesComponent;

  constructor(
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private http: HttpClient,
    private fotosService: FotosService,
    private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService,
    private documentosService: DocumentosService,
    private aspirantesBeneficioDocumentosService: AspirantesBeneficioDocumentosService
  ) { }

  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  devices: MediaDeviceInfo[] = []
  selectedDevice = ""
  capturedImage: string | null = null
  stream: MediaStream | null = null
  imageFormat: "jpeg" | "webp" = "webp"
  downloadPath = "C:/Users/DELL 540/AppData/Roaming/Aspirantes Beneficio/imagenesBeneficiarios"
  editFoto: Aspirante | null = null
  imgFoto = signal<string | null>(null);
  isCheckboxChecked: boolean = false;

  documentFileLoaded: boolean = false;
  lblUploadingFile: string = '';
  documentFile: any = {
    file: '',
    archivos: []
  }
  habilitarSubirDocumento: string = '';

  ngOnInit() {
    this.getAvailableCameras()

    this.aspirantesBeneficioService.habilitarSubirDocumento().subscribe(res => {
      if (res.response && res.data.length > 0) {
        this.habilitarSubirDocumento = res.data[0].valor; // Accede correctamente a 'valor'
      }
    });

    this.activatedRoute.params
      .pipe(
        switchMap(({ id }) => this.aspirantesBeneficioService.getAspiranteBeneficioId(id)),
      ).subscribe(aspirante => {
        if (!aspirante) {
          this.router.navigateByUrl('/');
          return;
        }
        const imgfoto = aspirante.data;

        this.fotosService.getAspiranteFotoId(imgfoto.id_foto).subscribe({
          next: (response) => {
            this.imgFoto.set(environment.baseUrl + '/' + response.data);
          },
          error: (err) => {
            console.error('Error fetching photo:', err);
          }
        });

      });

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

  savePhoto(name: string, path: string = 'imagenesBeneficiarios'): void {
    if (!this.capturedImage) {
      console.warn('No hay imagen capturada para guardar');
      return;
    }

    if (!window.electronAPI) {
      console.error('Electron API no disponible');
      return;
    }

    try {
      window.electronAPI.savePhoto(this.capturedImage, name, path);
    } catch (error) {
      console.error('Error al enviar imagen para guardar:', error);
    }
  }

  async savePdf(name: string): Promise<string> {
    if (!this.documentFile?.file) {
      throw new Error('No hay documento PDF seleccionado');
    }

    if (!window.electronAPI) {
      throw new Error('Electron API no disponible');
    }

    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(this.documentFile.file);
      return await window.electronAPI.savePdf(arrayBuffer, name);
    } catch (error: any) {
      console.error('Error al guardar PDF:', error);
      throw new Error(`No se pudo guardar el PDF: ${error.message}`);
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
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

  async uploadFoto(): Promise<void> {
    if (!this.datosGeneralesComponent) {
      console.error("DatosGeneralesComponent is not available for uploadDocs.");
      return;
    }
    const formattedFecha = new Date().toISOString();
    const curp = this.datosGeneralesComponent.myForm.get('curp')?.value;

    try {
      // Crear foto en la base de datos local
      await this.fotosService.crearFoto({
        id_status: 1, // Asignar el estado adecuado
        fecha: formattedFecha,
        tipo: 'foto_aspben',
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

  async uploadDocs(): Promise<void> {
    if (!this.datosGeneralesComponent) {
      console.error("DatosGeneralesComponent is not available for uploadDocs.");
      return;
    }
    const formattedFecha = new Date().toISOString();
    const curp = this.datosGeneralesComponent.myForm.get('curp')?.value;

    try {
      // Crear foto en la base de datos local
      await this.documentosService.crearDocumento({
        id_status: 1, // Asignar el estado adecuado
        fecha: formattedFecha,
        tipo: 'doc_aspben',
        archivo: curp + '.pdf',
        path: 'docsaspirantesbeneficio/' + curp + '.pdf', // Asignar el path adecuado si es necesario
        archivoOriginal: `captured_file.pdf`,
        extension: 'pdf',
        created_id: 0, // Asignar el ID adecuado si es necesario
        created_at: formattedFecha
      });
    } catch (error) {
      console.error('Error al guardar el documento en la base de datos local:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.datosGeneralesComponent) {
      console.error("DatosGeneralesComponent is not available for uploadDocs.");
      return;
    }
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
          await this.uploadFoto(); // Subir la foto después de crear el aspirante

          this.savePhoto(form.curp);

          // Obtenemos el último ID de la tabla de aspirantes y de la tabla de fotos
          const lastIdApirante = await this.aspirantesBeneficioService.getLastId() || 0;
          const lastIdFoto = await this.fotosService.getLastId() || 0;

          // Guardar el archivo PDF si se ha cargadoI
          if (this.documentFile.file && this.isCheckboxChecked) {

            // Subir el documento a la base de datos
            await this.uploadDocs();

            // Guardar el documento en el directorio local
            this.savePdf(form.curp);

            // Obtenemos el último ID de la tabla de documentos
            const lastIdDocumento = await this.documentosService.getLastId() || 0;

            // Creamos la relación entre el aspirante y el documento
            await this.aspirantesBeneficioDocumentosService.crearRelacion({
              id_aspirante_beneficio: lastIdApirante,
              id_documento: lastIdDocumento,
              id_status: 1,
              created_id: 0,
              created_at: ""
            });
          }


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

          // Borramos la foto, el archivo PDF y los datos del formulario
          this.capturedImage = null;
          this.documentFile.file = null;
          this.lblUploadingFile = '';
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
    if (!this.datosGeneralesComponent) {
      console.error("DatosGeneralesComponent is not available for uploadDocs.");
      return;
    }
    // Detener el video de la cámara
    this.stopStream();

    // Verificamos si el formulario es válido
    if (this.datosGeneralesComponent.myForm.valid) {
      // obtengo la informacion del formulario a editar
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

      if (this.capturedImage && this.imgFoto()) {
        try {
          // Crear la nueva foto en la base de datos
          const formattedFecha = new Date().toISOString();
          const curp = form.curp;
          const nuevaFoto = {
            id_status: 1,
            fecha: formattedFecha,
            tipo: 'foto_aspben',
            archivo: curp + '.webp',
            path: 'docsaspirantesbeneficio/' + curp + '.webp',
            archivoOriginal: `captured_photo.${this.imageFormat}`,
            extension: this.imageFormat,
            created_id: 0,
            created_at: formattedFecha
          };

          const responseFoto = await this.fotosService.createFoto(nuevaFoto).toPromise();
          const newPhotoId = responseFoto?.data.id;

          if (newPhotoId) {

            // Actualizar la relación con el nuevo ID de la foto
            await this.aspirantesBeneficioFotosService.editRelacion({
              id_aspirante_beneficio: form.id,
              id_foto: newPhotoId
            });

            // Guardar la foto en el directorio local
            this.savePhoto(curp);

            // Subir la foto al servidor
            await this.fotosService.registerPhoto(form, nuevaFoto);
          }
        } catch (error) {
          console.error("Error al registrar la nueva foto, actualizar la relación o subir la foto:", error);
        }
      }

    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      // Mostrar los errores en la consola del formulario
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
    }
  }
}
