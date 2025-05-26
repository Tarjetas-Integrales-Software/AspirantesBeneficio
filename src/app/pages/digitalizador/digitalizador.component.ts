import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  inject,
  ViewChild,
  ElementRef,
  Component,
  signal,
  type OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Observable, startWith, map, interval, Subscription, lastValueFrom, takeWhile } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Chart, registerables } from 'chart.js';
import { FileSystemService } from '../../services/file-system.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron.service';
import Swal from 'sweetalert2';
import { ConfigDigitalizadorService } from '../../services/CRUD/config-digitalizador.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { UtilService } from '../../services/util.service';
import { DigitalizarArchivosService } from '../../services/CRUD/digitalizar-archivos.service';

Chart.register(...registerables);

export interface Curp {
  value: string;
  name: string;
}

@Component({
  selector: 'app-digitalizador',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    //AsyncPipe,
    MatListModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './digitalizador.component.html',
  styleUrl: './digitalizador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalizadorComponent implements OnInit, OnDestroy {

  @ViewChild('myBarChart') myBarChart!: ElementRef;
  chart!: Chart;
  chartData: any[] = []; // Tus datos vendrán aquí
  chartData_construida: any[] = []; // Tus datos vendrán aquí

  private monitorSubscription: Subscription = Subscription.EMPTY;
  //private carpetaOrigen: string = 'C:\\Users\\Juan Pablo\\AppData\\Roaming\\Aspirantes Beneficio\\ArchivosDigitalizados';
  private carpetaOrigen: string = 'C:\\ExpedientesBeneficiarios\\Digitalizados';
  private carpetaDestino: string = 'C:\\ExpedientesBeneficiarios\\Enviados';
  private intervalo: number = 5000; // 3 segundos


  private fb = inject(FormBuilder);
  @ViewChild('tiempoSyncSeg') tiempoSyncSegRef!: ElementRef<HTMLInputElement>;

  filteredOptions?: Observable<Curp[]>;
  //chart: any;
  showModal_configuraciones = false;
  showModal_upload_esperados_tipo_archivo = false;

  curpsesControl = new FormControl();
  isMonitoring: boolean = false;

  private fs: any;
  private path: any;

  formFiltrosDigitalizador: FormGroup;
  formBusqueda: FormGroup;
  nombres_archivos_upload: any[] = [];

  archivosEsperados: { id: number, nombre_archivo: string, status: number }[] = [];

  spanValues: any = {};
  private updateSubscription: Subscription = new Subscription();
  private isAlive = true; // Flag para controlar la suscripción

  private nombre_archivo_upload_selected = ''

  readonly targetDirectory = 'C:\\ExpedientesBeneficiarios';
  readonly targetDirectory_Digitalizados = 'C:\\ExpedientesBeneficiarios\\Digitalizados';
  readonly targetDirectory_Enviados = 'C:\\ExpedientesBeneficiarios\\Enviados';

  constructor(
    private cdr: ChangeDetectorRef,
    private fileSystemService: FileSystemService,
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private configDigitalizadorService: ConfigDigitalizadorService,
    private networkStatusService: NetworkStatusService,
    private utilService: UtilService,
    private digitalizarArchivosService: DigitalizarArchivosService,
    //private logger: NGXLogger
  ) {
    this.fs = window.require('fs');
    this.path = window.require('path');

    this.formFiltrosDigitalizador = this.fb.nonNullable.group({
      tiposArchivoDigitalizador: '',
      nombresArchivosUpload: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
    });

    this.formBusqueda = this.fb.nonNullable.group({
      search: '',
    });

    Chart.register(...registerables); // Registra todos los componentes de Chart.js
  }

  async ngOnInit() {
    const online = this.networkStatusService.checkConnection();
    if (online) {
      try {
        await this.syncDataBase();

        this.getNombresArchivosUploadDigitalizador();
        this.getContenedores();
        this.getTiposDocDig();
        this.getExtensiones();
        this.getArchivosEsperados();


        this.initializeChart();


        // Carga inicial
        this.updateData();

        // Configurar intervalo de 5 segundos usando RxJS (mejor práctica)
        this.updateSubscription = interval(5000)
          .pipe(takeWhile(() => this.isAlive))
          .subscribe(() => {
            this.updateData();
          });

      } catch (error) {

      }
    }

    //    this.chart = new Chart('myBarChart', this.bar);

    if (this.electronService.isElectron) {
      console.log('Running in Electron!');
    }

    // Crea Carpeta Expedientes Beneficiarios en disco C, para poder garantizar que las rutas Digitalizador y Enviados puedan existir al momento del procesamiento de archivos.
    this.creaCarpetaExpedientes();
    this.creaCarpetaExpedientes_Digitalizados();
    this.creaCarpetaExpedientes_Enviados();

    // Asegurar que el README.txt exista al iniciar el componente
    this.fileSystemService.ensureFileExists(
      'README.txt',
      this.targetDirectory_Digitalizados
    );
    this.fileSystemService.ensureFileExists(
      'README.txt',
      this.targetDirectory_Enviados
    );

    // Insertar Configuracion Inicial en la tabla de sy_config_digitalizador
    this.configDigitalizadorService.CreateConfigInicialDigitalizador();
  }

  onChangeOption_NombreArchivoUpload(event: MatSelectChange): void {
    const optionSelected = event.value;
    console.log('Opcion seleccionada:', optionSelected);

    // Aquí puedes ejecutar cualquier lógica necesaria
    if (optionSelected) {
      this.nombre_archivo_upload_selected = optionSelected;
    } else {
      this.nombre_archivo_upload_selected = '';
    }
  }

  myForm: FormGroup = this.fb.group({
    curp: [
      '',
      [
        Validators.required,
        Validators.minLength(18),
        Validators.pattern(
          /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/
        ),
      ],
    ],
    curpses: this.curpsesControl,
  });

  myForm_Config: FormGroup = this.fb.group({
    id_tipo_doc_dig: ['', [Validators.required]],
  });

  myForm_Upload: FormGroup = this.fb.group({
    id_tipo_doc_dig: ['', [Validators.required]],
    id_extension: ['', [Validators.required]],
    file: ''
  });

  myForm_Footer: FormGroup = this.fb.group({
    id_contenedor: ['', [Validators.required]],
  });



  toggleModal_Configuraciones() {
    this.showModal_configuraciones = !this.showModal_configuraciones;
  }

  toggleModal_UploadEsperadosTipoArchivo() {
    this.showModal_upload_esperados_tipo_archivo = !this.showModal_upload_esperados_tipo_archivo;
  }


  initializeChart(): void {
    if (this.chart) {
      this.chart.destroy(); // Destruye el gráfico anterior si existe
    }

    //this.chart = new Chart('myBarChart', this.bar);

    const ctx = this.myBarChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.map(item => item.label), // Ajusta según tu estructura de datos
        datasets: [{
          label: '',
          data: this.chartData.map(item => item.value), // Ajusta según tu estructura
          backgroundColor: [
            '#6B7280',
            '#14B8A6',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        }
      },
    });
  }

  // Método para actualizar los datos
  updateChartData(newData: any[]): void {
    this.chartData = [...newData];
    console.log(this.chartData, 'Chart-Data');

    this.chartData_construida = [
      {
        label: 'Esperadas',
        value: this.chartData[0]?.esperadas
      },
      {
        label: 'Enviadas',
        value: this.chartData[0]?.enviadas_tisa
      }
    ]

    if (this.chart) {
      this.chart.data.labels = this.chartData_construida.map(item => item.label);
      this.chart.data.datasets[0].data = this.chartData_construida.map(item => item.value);
      this.chart.update(); // Actualiza el gráfico con los nuevos datos
    } else {
      this.initializeChart();
    }

    // Forzar detección de cambios si es necesario
    this.cdr.detectChanges();
  }


  async updateData(): Promise<void> {
    try {
      // Obtener datos actualizados
      //let nombre_archivo_upload = 'ArchivosEsperadosDigitalizar_20250509_170514.pdf';
      let nombre_archivo_upload = this.nombre_archivo_upload_selected;

      if (this.nombre_archivo_upload_selected != '') {
        const newData = await this.digitalizarArchivosService.get_data_esperados_digitalizados(nombre_archivo_upload).toPromise();
        console.log(newData);

        // Actualizar valores para los spans
        this.spanValues = { ...newData.data || [] };
        console.log(this.spanValues);

        if (this.spanValues.length === 0) {
          this.spanValues.push({ esperadas: 0, digitalizadas: 0, enviadas_tisa: 0 });
        }


        this.updateChartData(newData.data);



        // Actualizar arreglo para el chart
        //this.chartData = [...newData.chartInfo];

        // Forzar detección de cambios si es necesario
        this.cdr.detectChanges();
      }


    } catch (error) {
      console.error('Error al actualizar datos:', error);
      this.spanValues = [{ esperadas: 0, digitalizadas: 0, enviadas_tisa: 0 }];
    }
  }

  ngOnDestroy(): void {
    this.detenerMonitor();

    // Limpieza para evitar memory leaks
    this.isAlive = false;
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

  }

  async syncDataBase(): Promise<void> {
    try {


      // Convertimos cada observable a promesa con lastValueFrom (de RxJS)
      const nombresArchivos = await lastValueFrom(this.configDigitalizadorService.getNombresArchivosUploadDigitalizador());
      await this.configDigitalizadorService.syncLocalDataBase_NombresArchivosUpload(nombresArchivos.data);

      const tiposDocs = await lastValueFrom(this.configDigitalizadorService.getTiposDocsDigitalizador());
      await this.configDigitalizadorService.syncLocalDataBase_TiposDocsDigitalizador(tiposDocs.data);

      const contenedores = await lastValueFrom(this.configDigitalizadorService.getContenedores());
      await this.configDigitalizadorService.syncLocalDataBase_Contenedores(contenedores.data);

      const extensiones = await lastValueFrom(this.configDigitalizadorService.getExtensiones());
      await this.configDigitalizadorService.syncLocalDataBase_Extensiones(extensiones.data);
    } catch (error) {
      console.error('Error en sincronización:', error);
      throw error; // Opcional: re-lanzar el error si quieres manejarlo fuera
    }


  }

  async creaCarpetaExpedientes() {
    try {

      const exists = await this.fileSystemService.directoryExists(
        this.targetDirectory
      );

      if (!exists) {
        const created = await this.fileSystemService.ensureDirectoryExists(
          this.targetDirectory
        );
        if (created) {
          console.log(`Directorio creado: ${this.targetDirectory}`);
          this.snackBar.open(
            `Directorio creado: ${this.targetDirectory}`,
            'Cerrar',
            {
              duration: 3000,
            }
          );
        }
      } else {
        console.log(`El directorio ya existe: ${this.targetDirectory}`);
        this.snackBar.open(
          `Directorio ya existe: ${this.targetDirectory}`,
          'Cerrar',
          {
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.error('Error al verificar/crear el directorio:', error);
      this.snackBar.open(`Error al crear directorio: ${error}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  async creaCarpetaExpedientes_Digitalizados() {
    try {
      const exists = await this.fileSystemService.directoryExists(
        this.targetDirectory_Digitalizados
      );

      if (!exists) {
        const created = await this.fileSystemService.ensureDirectoryExists(
          this.targetDirectory_Digitalizados
        );
        if (created) {
          console.log(
            `Directorio creado: ${this.targetDirectory_Digitalizados}`
          );
          this.snackBar.open(
            `Directorio creado: ${this.targetDirectory_Digitalizados}`,
            'Cerrar',
            {
              duration: 3000,
            }
          );
        }
      } else {
        console.log(
          `El directorio ya existe: ${this.targetDirectory_Digitalizados}`
        );
        this.snackBar.open(
          `Directorio ya existe: ${this.targetDirectory_Digitalizados}`,
          'Cerrar',
          {
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.error('Error al verificar/crear el directorio:', error);
      this.snackBar.open(`Error al crear directorio: ${error}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  async creaCarpetaExpedientes_Enviados() {
    try {
      const exists = await this.fileSystemService.directoryExists(
        this.targetDirectory_Enviados
      );

      if (!exists) {
        const created = await this.fileSystemService.ensureDirectoryExists(
          this.targetDirectory_Enviados
        );
        if (created) {
          console.log(`Directorio creado: ${this.targetDirectory_Enviados}`);
          this.snackBar.open(
            `Directorio creado: ${this.targetDirectory_Enviados}`,
            'Cerrar',
            {
              duration: 3000,
            }
          );
        }
      } else {
        console.log(
          `El directorio ya existe: ${this.targetDirectory_Enviados}`
        );
        this.snackBar.open(
          `Directorio ya existe: ${this.targetDirectory_Enviados}`,
          'Cerrar',
          {
            duration: 3000,
          }
        );
      }
    } catch (error) {
      console.error('Error al verificar/crear el directorio:', error);
      this.snackBar.open(`Error al crear directorio: ${error}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  showDialog() {
    if (this.electronService.isElectron) {
      console.log('SI es electron');
      this.electronService.dialog
        ?.showOpenDialog({
          properties: ['openFile'],
        })
        .then((result) => {
          if (!result.canceled) {
            console.log('Archivo seleccionado:', result.filePaths[0]);
          }
        });
    } else {
      console.log('NO es electron');
    }
  }

  displayFn(curp: Curp): string {
    return curp && curp.name ? curp.name : '';
  }

  public bar: any = {
    type: 'bar',
    data: {
      labels: ['Esperados', 'Digitalizados', 'Enviados'],
      datasets: [
        {
          label: '',
          data: [50000, 20000, 7500],
          backgroundColor: [
            'rgba(129, 125, 126, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(148, 226, 152, 0.2)',
          ],
          borderColor: [
            'rgba(129, 125, 126, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(148, 226, 152, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
          text: 'Grafica Cantidad Expedientes por Status',
        },
      },
    },
  };

  // Signals para almacenar las rutas
  sourcePath = signal<string>('');
  destinationPath = signal<string>('');
  timeSync = signal<number>(10);

  // Método para manejar la selección de la ruta de origen
  onSourcePathSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('entre al if');
      // Obtenemos la ruta del directorio seleccionado
      // Nota: debido a restricciones de seguridad del navegador, solo obtenemos el nombre
      // del directorio, no la ruta completa del sistema de archivos
      this.sourcePath.set(input.files[0].webkitRelativePath.split('/')[0]);
    } else {
      console.log('entre al else');
      // Caso cuando el directorio está vacío
      // Esto solo funciona en algunos navegadores
      const path = input.value;
      console.log(path);
      if (path.includes('\\')) {
        this.sourcePath.set(path.split('\\').slice(0, -1).join('\\'));
      } else if (path.includes('/')) {
        this.sourcePath.set(path.split('/').slice(0, -1).join('/'));
      }
    }
    console.log(this.sourcePath);
  }

  // Método para manejar la selección de la ruta de destino
  onDestinationPathSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('entre al if');
      this.destinationPath.set(input.files[0].webkitRelativePath.split('/')[0]);
    } else {
      console.log('entre al else');
      // Caso cuando el directorio está vacío
      // Esto solo funciona en algunos navegadores
      const path = input.value;
      console.log(path);
      if (path.includes('\\')) {
        this.destinationPath.set(path.split('\\').slice(0, -1).join('\\'));
      } else if (path.includes('/')) {
        this.destinationPath.set(path.split('/').slice(0, -1).join('/'));
      }
    }
    console.log(this.destinationPath);
  }

  // Método para guardar las rutas
  async saveDirectories(): Promise<void> {
    try {
      const ruta_origen = this.path.join(
        this.targetDirectory,
        this.sourcePath()
      );
      const ruta_destino = this.path.join(
        this.targetDirectory,
        this.destinationPath()
      );
      const tiempo_sync = this.getTiempoSyncSegValue();

      // Guardar informacion de configuracion de digitalizador en la db Local
      await this.configDigitalizadorService.localCreateOrUpdate_ConfigDigitalizador({
        ruta_digitalizados: ruta_origen,
        ruta_enviados: ruta_destino,
        tiempo_sync: tiempo_sync,
      });

      // Obtener configuración
      const config =
        await this.configDigitalizadorService.consultarConfigDigitalizador();
      console.log(config);
      if (config) {
        Swal.fire({
          title: 'Configuracion Almacenada Correctamente',
          html: `
            <b>Ruta Digitalizados:</b> ${config.ruta_digitalizados || 'No definida'
            }<br>
            <b>Ruta Enviados:</b> ${config.ruta_enviados || 'No definida'}<br>
            <b>Intervalo Sync:</b> ${config.tiempo_sync
              ? config.tiempo_sync + ' segundos'
              : 'No definido'
            }
          `,
          icon: 'success',
          timer: 5000,
          showConfirmButton: false,
          confirmButtonText: 'Aceptar',
        });
        console.log('Configuración actual:', config);
      } else {
        Swal.fire({
          title: 'Configuración no encontrada',
          text: 'No existe configuración guardada',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
        });
        console.log('No existe configuración guardada');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al obtener la configuración',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      console.error('Error al obtener configuración:', error);
    }

    //console.log("Ruta origen:", this.sourcePath())
    //console.log("Ruta destino:", this.destinationPath())
    //alert(`Rutas guardadas:\nOrigen: ${this.sourcePath()}\nDestino: ${this.destinationPath()}`)
  }

  // Método para obtener el valor
  getTiempoSyncSegValue() {
    const value = this.tiempoSyncSegRef.nativeElement.valueAsNumber;
    console.log('Valor numérico:', value);
    return value;
  }

  // Método para el evento change
  onTiempoSyncSegChange() {
    const value = this.tiempoSyncSegRef.nativeElement.value;
    console.log('Valor como string:', value);
  }

  // Método para abrir el selector de archivos programáticamente
  openFileSelector(inputId: string): void {
    document.getElementById(inputId)?.click();
  }

  toggleMonitoreo() {
    this.isMonitoring = !this.isMonitoring;
    if (this.isMonitoring) {
      this.startMonitoreo();
    } else {
      this.stopMonitoreo();
    }
  }

  startMonitoreo() {
    this.isMonitoring = true;
    console.log('START Presionado');
    this.iniciarMonitor();
  }

  stopMonitoreo() {
    this.isMonitoring = false;
    console.log('STOP Presionado');
    this.detenerMonitor();
  }

  buscarCurps() { }

  isValidField(fieldName: string): boolean | null {
    return (
      this.myForm.controls[fieldName].errors &&
      this.myForm.controls[fieldName].touched
    );
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
        case 'pattern':
          return 'El formato de la curp no es correcto';
      }
    }
    return null;
  }

  toUpperCaseCurp(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.myForm.get('curp')?.setValue(input.value);
  }

  tipos_documento_dig: any[] = [];
  contenedores: any[] = [];
  extensiones: any[] = [];

  selectedValue_2: string = '';
  selectedValue_3: string = '';
  selectedValue_4: string = '';
  selectedValue_5: string = '';

  selectedValue2() {
    this.selectedValue_2 = this.myForm_Config.get('id_tipo_doc_dig')?.value;

    switch (Number(this.selectedValue_2)) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        break;

      default:
        break;
    }
  }

  selectedValue3() {
    this.selectedValue_3 = this.myForm_Upload.get('id_tipo_doc_dig')?.value;

    switch (Number(this.selectedValue_3)) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        break;

      default:
        break;
    }
  }

  selectedValue4() {
    this.selectedValue_4 = this.myForm_Footer.get('id_contenedor')?.value;

    switch (Number(this.selectedValue_4)) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        break;

      default:
        break;
    }
  }

  selectedValue5() {
    this.selectedValue_5 = this.myForm_Upload.get('id_extension')?.value;

    switch (Number(this.selectedValue_5)) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        break;

      default:
        break;
    }
  }



  getNombresArchivosUploadDigitalizador(): void {
    this.configDigitalizadorService
      .consultarNombresArchivosUpload()
      .then((nombres_archivos_upload) => {
        this.nombres_archivos_upload = nombres_archivos_upload;
      })
      .catch((error) => console.error('Error al obtener los nombres archivos upload:', error));
  }

  getTiposDocDig(): void {
    this.configDigitalizadorService
      .consultarTiposDocsDigitalizador()
      .then((tipos_documento_dig) => {
        this.tipos_documento_dig = tipos_documento_dig;
      })
      .catch((error) => console.error('Error al obtener tipos documentos digitalizacion:', error));
  }

  getContenedores(): void {
    this.configDigitalizadorService
      .consultarContenedores()
      .then((contenedores) => {
        this.contenedores = contenedores;
      })
      .catch((error) => console.error('Error al obtener los contenedores:', error));
  }

  getExtensiones(): void {
    this.configDigitalizadorService
      .consultarExtensiones()
      .then((extensiones) => {
        this.extensiones = extensiones;
      })
      .catch((error) => console.error('Error al obtener los extensiones:', error));
  }

  rolesUsuario: Array<{ fkRole: number }> = [];
  rolesConPermisoAdmin: number[] = [104];

  //IMPORTAR EXCEL
  lblUploadingFile: string = '';
  documentFileLoaded: boolean = false;
  documentFile: any = {
    file: '',
    archivos: []
  }

  datosExcel: any[] = [];
  mensaje: string = '';

  get permisoAccionesAdmin(): boolean {
    // Verifica si algún perfil tiene un role que esté en el arreglo rolesConPermiso
    return this.rolesUsuario.some(
      (perfil) =>
        perfil.fkRole && this.rolesConPermisoAdmin.includes(Number(perfil.fkRole))
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log(file, 'file');
    if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      this.lblUploadingFile = file.name;
      this.documentFile.file = file;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
      this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado
      if (this.selectedValue_3 != null) {
        let tipo_doc = Number(this.selectedValue_3);
        let ext = this.selectedValue_5;
        this.importarExcel_ArchivosDigitalizar(this.documentFile.file, tipo_doc, ext);
      } else {
        Swal.fire('Error', 'Por favor Selecciona el tipo de documento', 'error');
      }
    } else {
      Swal.fire('Error', 'Solo se permiten archivos EXCEL', 'error');
      this.lblUploadingFile = '';
      this.documentFile.file = null;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(null); // Eliminar esta línea
      this.documentFileLoaded = false; // Marcar que no hay archivo cargado
    }
  }





  async importarExcel_ArchivosDigitalizar(file: any, tipo_doc: number, ext: string) {
    const archivo = file; //event.target.files[0];
    if (archivo) {
      await this.utilService.leerExcel_ArchivosDigitalizar(archivo, tipo_doc, ext).then(
        (response) => {
          if (response) {
            console.log('Respuesta del servidor:', response);
            this.mensaje = 'Datos importados exitosamente.';

            this.datosExcel = [];
            this.resetForm();

            Swal.fire({
              title: 'Importacion Generada con Éxito !!!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            console.error('Error al enviar los datos:', response);
            this.mensaje = 'Hubo un error al importar los datos.';
            Swal.fire({
              title: 'Ocurrio un Error en la Importacion',
              icon: 'error',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      );

    }
  }

  @ViewChild('fileInput') fileInput!: ElementRef;

  resetForm() {
    this.myForm_Upload.reset();
    this.lblUploadingFile = '';
    this.fileInput.nativeElement.value = ''; // Resetear solo el input file
  }


  ////////////////////////////////////////////////////
  /* METODOS PARA EL MONITOREO Y SUBIDA DE ARCHIVOS */
  ////////////////////////////////////////////////////


  iniciarMonitor(): void {
    //this.logger.info('Iniciando monitor de directorios...');
    this.monitorSubscription = interval(this.intervalo).subscribe(() => {
      this.procesarArchivos();
    });

    // Procesar inmediatamente al iniciar
    this.procesarArchivos();
  }

  detenerMonitor(): void {
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
      //this.logger.info('Monitor de directorios detenido');
    }
  }

  procesarArchivos(): void {
    //this.logger.info('Buscando archivos para procesar...');
    this.digitalizarArchivosService.procesarArchivosEnParalelo(this.carpetaOrigen, this.carpetaDestino)
      .subscribe({
        next: (resultados) => {
          const exitosos = resultados.filter(r => r).length;
          //this.logger.info(`Proceso completado. ${exitosos}/${resultados.length} archivos procesados con éxito.`);
        },
        error: (error) => {
          //this.logger.error(`Error en el proceso general: ${error.message}`);
        }
      });
  }

  getArchivosEsperados() {
    const searchValue = this.formBusqueda.get('search')?.value || '';

    this.digitalizarArchivosService.getArchivosEsperados({ search: searchValue }).subscribe({
      next: response => {
        this.archivosEsperados = response.data;

        this.cdr.detectChanges();
      },
      error: error => { }
    })
  }
}
