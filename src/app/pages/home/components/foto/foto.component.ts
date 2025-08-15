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
import { switchMap, of, from, concatMap, tap, catchError, concat, map, last } from "rxjs";
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

  /**
   * Obtiene un mensaje de error personalizado para un campo específico
   * @param fieldName Nombre del campo del formulario
   * @param errors Objeto de errores del campo
   * @returns Mensaje de error amigable para el usuario
   */
  private getPersonalizedErrorMessage(fieldName: string, errors: any): string {
    const fieldDisplayNames: { [key: string]: string } = {
      'id_modalidad': 'Modalidad',
      'curp': 'CURP',
      'nombre': 'Nombre',
      'apellido_paterno': 'Apellido Paterno',
      'apellido_materno': 'Apellido Materno',
      'telefono': 'Teléfono',
      'fecha_nacimiento': 'Fecha de Nacimiento',
      'email': 'Correo Electrónico',
      'municipio': 'Municipio',
      'cp': 'Código Postal',
      'colonia': 'Colonia',
      'domicilio': 'Domicilio',
      'com_obs': 'Comentarios y Observaciones',
      'fecha_evento': 'Fecha de Evento'
    };

    const fieldDisplayName = fieldDisplayNames[fieldName] || fieldName;

    for (const errorType of Object.keys(errors)) {
      switch (errorType) {
        case 'required':
          return `⚠️ El campo "${fieldDisplayName}" es obligatorio.`;

        case 'email':
          return `📧 Ingrese un correo electrónico válido en "${fieldDisplayName}".`;

        case 'minlength':
          const minLength = errors[errorType].requiredLength;
          const actualLength = errors[errorType].actualLength;
          return `📏 "${fieldDisplayName}" debe tener al menos ${minLength} caracteres (actualmente tiene ${actualLength}).`;

        case 'maxlength':
          const maxLength = errors[errorType].requiredLength;
          return `📏 "${fieldDisplayName}" no puede tener más de ${maxLength} caracteres.`;

        case 'pattern':
          if (fieldName === 'curp') {
            return `🆔 La CURP ingresada no tiene el formato correcto. Verifique que tenga 18 caracteres y el formato válido.`;
          }
          return `❌ El formato de "${fieldDisplayName}" no es válido.`;

        case 'curpBeneficiado':
          return `⛔ Esta CURP ya cuenta con un beneficio registrado anteriormente.`;

        default:
          return `❌ Error en "${fieldDisplayName}": ${errorType}`;
      }
    }

    return `❌ Error en el campo "${fieldDisplayName}".`;
  }

  mostrarErrores(form: FormGroup) {
    const errorMessages: string[] = [];
    let errorCount = 0;

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      const controlErrors = control ? control.errors : null;

      if (controlErrors != null && control?.touched) {
        errorCount++;
        const personalizedMessage = this.getPersonalizedErrorMessage(key, controlErrors);
        errorMessages.push(personalizedMessage);
      }
    });

    if (errorMessages.length > 0) {
      const title = errorCount === 1
        ? 'Error en el formulario'
        : `Errores en el formulario (${errorCount})`;

      const htmlContent = `
        <div style="text-align: left; line-height: 1.6;">
          <p style="margin-bottom: 15px; color: #d32f2f;">
            <strong>Por favor, corrija ${errorCount === 1 ? 'el siguiente error' : 'los siguientes errores'}:</strong>
          </p>
          <ul style="margin: 0; padding-left: 20px;">
            ${errorMessages.map(msg => `<li style="margin-bottom: 8px;">${msg}</li>`).join('')}
          </ul>
        </div>
      `;

      Swal.fire({
        title: title,
        html: htmlContent,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d32f2f',
        width: '500px',
        customClass: {
          htmlContainer: 'text-left'
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.datosGeneralesComponent) {
      console.error("DatosGeneralesComponent is not available for uploadDocs.");
      return;
    }

    this.stopStream();

    if (!this.datosGeneralesComponent.myForm.valid) {
      this.datosGeneralesComponent.myForm.markAllAsTouched();
      this.mostrarErrores(this.datosGeneralesComponent.myForm);
      this.submitForm.emit();
      return;
    }

    if (!this.capturedImage) {
      console.log('No hay imagen capturada para subir');
      Swal.fire({ title: 'Error', text: 'Debe capturar una imagen antes de guardar.', icon: 'warning', confirmButtonText: 'Aceptar' });
      this.submitForm.emit();
      return;
    }

    this.datosGeneralesComponent.onSafe();

    // Variables para rollback
    let aspiranteCreado: number | null = null;
    let fotoCreada: number | null = null;
    let documentoCreado: number | null = null;
    let relacionFoto: { asp: number, foto: number } | null = null;
    let relacionDoc: { asp: number, doc: number } | null = null;

    // Obtener datos del formulario (usa Promise -> convertimos con from())
    from(this.datosGeneralesComponent.getMyForm()).pipe(
      concatMap((form: Aspirante) => {
        const formattedFecha = new Date().toISOString();
        const fotoData = {
          id_status: 1,
          fecha: formattedFecha,
          tipo: 'foto_aspben',
          archivo: form.curp + '.webp',
          path: 'docsaspirantesbeneficio/' + form.curp + '.webp',
            archivoOriginal: `captured_photo.${this.imageFormat}`,
          extension: this.imageFormat,
          created_id: 0,
          created_at: formattedFecha
        };
        const documentoData = {
          id_status: 1,
          fecha: formattedFecha,
          tipo: 'doc_aspben',
          archivo: form.curp + '.pdf',
          path: 'docsaspirantesbeneficio/' + form.curp + '.pdf',
          archivoOriginal: `captured_file.pdf`,
          extension: 'pdf',
          created_id: 0,
          created_at: formattedFecha
        };

        return from(this.aspirantesBeneficioService.crearAspirante(form)).pipe(
          concatMap(() => this.aspirantesBeneficioService.getLastId()),
          tap(id => aspiranteCreado = id),
          concatMap(() => this.fotosService.crearFotoLocal(fotoData)),
          concatMap(() => this.fotosService.getLastIdObservable()),
          tap(id => {
            fotoCreada = id;
            this.savePhoto(form.curp);
          }),
          concatMap(() => this.aspirantesBeneficioFotosService.crearRelacionLocal({
            id_aspirante_beneficio: aspiranteCreado!,
            id_foto: fotoCreada!,
            id_status: 1,
            created_id: 0,
            created_at: fotoData.created_at
          })),
          tap(() => relacionFoto = { asp: aspiranteCreado!, foto: fotoCreada! }),
          concatMap(() => (this.documentFile.file && this.isCheckboxChecked) ?
            this.documentosService.crearDocumentoLocal(documentoData).pipe(
              concatMap(() => this.documentosService.getLastIdObservable()),
              tap(id => documentoCreado = id),
              concatMap(() => from(this.savePdf(form.curp))),
              concatMap(() => this.aspirantesBeneficioDocumentosService.crearRelacionLocal({
                id_aspirante_beneficio: aspiranteCreado!,
                id_documento: documentoCreado!,
                id_status: 1,
                created_id: 0,
                created_at: documentoData.created_at
              })),
              tap(() => relacionDoc = { asp: aspiranteCreado!, doc: documentoCreado! })
            ) : of(null)
          ),
          catchError(err => {
            // Propagar error para manejar en el subscribe error
            throw err;
          })
        );
      })
    ).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Error en el proceso:', error);
        this.performRollback$(
          aspiranteCreado,
          fotoCreada,
          documentoCreado,
          relacionFoto,
          relacionDoc
        ).subscribe({
          complete: () => {
            Swal.fire({ title: 'Error en el registro', text: 'Ocurrió un error durante el proceso de registro. Los datos no se han guardado.', icon: 'error', confirmButtonText: 'Aceptar' });
            this.submitForm.emit();
          }
        });
      },
      complete: () => {
        Swal.fire({ title: 'Registro exitoso!', icon: 'success', timer: 2000, showConfirmButton: false });
        this.capturedImage = null;
        this.documentFile.file = null;
        this.lblUploadingFile = '';
        this.datosGeneralesComponent!.myForm.reset();
        this.datosGeneralesComponent!.myForm.markAsPristine();
        this.datosGeneralesComponent!.disabledGradoCarrera();
        this.submitForm.emit();
      }
    });
  }

  private performRollback$(
    aspiranteCreado: number | null,
    fotoCreada: number | null,
    documentoCreado: number | null,
    relacionFoto: { asp: number, foto: number } | null,
    relacionDoc: { asp: number, doc: number } | null,
  ) {
    const rollbackErrors: string[] = [];

    const tasks: any[] = [];

    const wrap = (label: string, obs$: any) => obs$.pipe(
      catchError((e: any) => {
        rollbackErrors.push(`Error en rollback de ${label}: ${e}`);
        return of(null); // continuar
      }),
      map(() => void 0)
    );

    if (relacionDoc) {
      tasks.push(wrap('relación documento', this.aspirantesBeneficioDocumentosService.rollbackRelacionDocumento(relacionDoc.asp, relacionDoc.doc)));
    }
    if (relacionFoto) {
      tasks.push(wrap('relación foto', this.aspirantesBeneficioFotosService.rollbackRelacion(relacionFoto.asp, relacionFoto.foto)));
    }
    if (documentoCreado) {
      tasks.push(wrap('documento', this.documentosService.rollbackDocumento(documentoCreado)));
    }
    if (fotoCreada) {
      tasks.push(wrap('foto', this.fotosService.rollbackFoto(fotoCreada)));
    }
    if (aspiranteCreado) {
      tasks.push(wrap('aspirante', this.aspirantesBeneficioService.rollbackAspirante(aspiranteCreado)));
    }

    if (!tasks.length) {
      return of(void 0);
    }

    return concat(...tasks).pipe(
      last(),
      tap(() => {
        if (rollbackErrors.length) {
          console.error('Errores durante el rollback:', rollbackErrors);
          Swal.fire({ title: 'Errores durante la limpieza', text: 'Se produjeron algunos errores al limpiar los datos. Revise la consola para más detalles.', icon: 'warning', confirmButtonText: 'Aceptar' });
        }
      }),
      map(() => void 0),
      catchError(e => {
        console.error('Error crítico durante el rollback:', e);
        return of(void 0);
      })
    );
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
