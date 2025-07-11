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
import { Observable, startWith, map, interval, Subscription, lastValueFrom, takeWhile, combineLatest, throwError } from 'rxjs';
import { distinctUntilChanged, catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatListOption, MatSelectionList } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { Chart, registerables } from 'chart.js';
import { FileSystemService } from '../../services/file-system.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron.service';
import Swal from 'sweetalert2';
import { ConfigDigitalizadorService } from '../../services/CRUD/config-digitalizador.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { UtilService } from '../../services/util.service';
import { DigitalizarArchivosService } from '../../services/CRUD/digitalizar-archivos.service';
import { ModulosService } from '../../services/CRUD/modulos.service';
import { AtencionSinCitaService } from '../../services/CRUD/atencion-sin-cita.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

Chart.register(...registerables);

interface Printer {
  name: string;
  displayName: string;
  description?: string;
  status: number;
  isDefault: boolean;
}

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
    MatListModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatTabsModule,
    MatCheckboxModule,
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

  private fb = inject(FormBuilder);
  @ViewChild('tiempoSyncSeg') tiempoSyncSegRef!: ElementRef<HTMLInputElement>;

  filteredOptions?: Observable<Curp[]>;

  showModalConfirmarCaratulas: boolean = false;
  showModalCaratulas: boolean = false;
  showModalConfiguraciones: boolean = false;
  showModalUploadEsperadosTipoArchivo: boolean = false;

  curpsesControl = new FormControl();
  isMonitoring: boolean = false;
  sinConfiguracion: boolean = true;

  private fs: any;
  private path: any;

  formCaratula: FormGroup;
  formFiltrosDigitalizador: FormGroup;
  formBusqueda: FormGroup;
  formConfiguracion: FormGroup;

  caratulas: string[] = [];
  modulos: any[] = [];
  grupos: any[] = [];
  printers: any[] = [];

  archivosEsperados: { id: number, nombre_archivo: string, status: number }[] = [];

  activeTab: number = 0;

  esperadas: number = 0;
  digitalizadas: number = 0;
  enviadas: number = 0;


  private updateSubscription: Subscription = new Subscription();
  private isAlive = true; // Flag para controlar la suscripción

  constructor(
    private cdr: ChangeDetectorRef,
    private fileSystemService: FileSystemService,
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private configDigitalizadorService: ConfigDigitalizadorService,
    private networkStatusService: NetworkStatusService,
    private utilService: UtilService,
    private digitalizarArchivosService: DigitalizarArchivosService,
    private modulosService: ModulosService,
    private atencionSinCitaService: AtencionSinCitaService,
  ) {
    const electronAPI = (window as any).electronAPI;
    const CURP_REGEX = /^([A-Z&]|[a-z&]{1})([AEIOU]|[aeiou]{1})([A-Z&]|[a-z&]{1})([A-Z&]|[a-z&]{1})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])([HM]|[hm]{1})(AS|as|BC|bc|BS|bs|CC|cc|CS|cs|CH|ch|CL|cl|CM|cm|DF|df|DG|dg|GT|gt|GR|gr|HG|hg|JC|jc|MC|mc|MN|mn|MS|ms|NT|nt|NL|nl|OC|oc|PL|pl|QT|qt|QR|qr|SP|sp|SL|sl|SR|sr|TC|tc|TS|ts|TL|tl|VZ|vz|YN|yn|ZS|zs|NE|ne)([^AEIOUaeiou]{1})([^AEIOUaeiou]{1})([^AEIOUaeiou]{1})([0-9]{2})$/;

    this.path = electronAPI?.path;
    this.fs = electronAPI?.fs;

    this.formCaratula = this.fb.nonNullable.group({
      impresora: '',
      fecha: new Date(),
      id_modulo: '',
      curp: ['', [Validators.pattern(CURP_REGEX)]],
    });

    this.formFiltrosDigitalizador = this.fb.nonNullable.group({
      tipo: '',
      grupo: { value: '', disabled: true },
      fechaInicio: new Date(),
      fechaFin: new Date(),
    });

    this.formBusqueda = this.fb.nonNullable.group({
      search: '',
    });

    this.formConfiguracion = this.fb.nonNullable.group({
      extension: '',
      rutaOrigen: '',
      rutaDestino: '',
      tipo: '',
      intervaloSincronizacion: 10,
      pesoMinimo: 300,
      regexCurp: /([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d)/
    });

    Chart.register(...registerables); // Registra todos los componentes de Chart.js
  }

  async ngOnInit() {
    const online = this.networkStatusService.checkConnection();

    if (online) {
      try {
        await this.syncDataBase();

        this.getContenedores();
        this.getExtensiones();
        this.getArchivosEsperados();


        this.initializeChart();


        // Carga inicial
        this.updateData();

        this.updateSubscription = interval(5000)
          .pipe(takeWhile(() => this.isAlive))
          .subscribe(() => {
            this.updateData();
          });

      } catch (error) {

      }
    }

    this.getTipos();
    this.getExtensiones();
    this.getAvailablePrinters();
    this.getModulos();

    const config =
      await this.configDigitalizadorService.consultarConfigDigitalizador();

    if (config === undefined) {
      this.sinConfiguracion = true;

      this.detenerMonitor();
      this.isMonitoring = false;

      return;
    } else this.sinConfiguracion = false;

    const { extension, peso_minimo, ruta_digitalizados, ruta_enviados, tiempo_sync, tipo, regex_curp } = await config

    this.formConfiguracion = this.fb.nonNullable.group({
      extension: extension,
      rutaOrigen: ruta_digitalizados,
      rutaDestino: ruta_enviados,
      intervaloSincronizacion: tiempo_sync,
      pesoMinimo: peso_minimo,
      tipo: tipo,
      regexCurp: regex_curp
    });

    this.formFiltrosDigitalizador.get('tipo')?.valueChanges.subscribe(tipoId => {
      if (tipoId) {
        const fechaInicio = this.formFiltrosDigitalizador.get('fechaInicio')?.value;
        const fechaFin = this.formFiltrosDigitalizador.get('fechaFin')?.value;

        this.getGrupos({ id_tipo_documento_digitalizacion: tipoId, fechaInicio: fechaInicio?.toISOString().substring(0, 10), fechaFin: fechaFin?.toISOString().substring(0, 10) });
        this.formFiltrosDigitalizador.get('grupo')?.reset();
        this.formFiltrosDigitalizador.get('nombres')?.reset();
      }
    });

    this.formFiltrosDigitalizador.get('fechaInicio')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const tipo = this.formFiltrosDigitalizador.get('tipo')?.value;
        const fechaFin = this.formFiltrosDigitalizador.get('fechaFin')?.value;

        this.getGrupos({ fechaInicio: fecha.toISOString().substring(0, 10), fechaFin: fechaFin?.toISOString().substring(0, 10), id_tipo_documento_digitalizacion: tipo });
        this.formFiltrosDigitalizador.get('grupo')?.reset();
        this.formFiltrosDigitalizador.get('nombres')?.reset();
      }
    });

    this.formFiltrosDigitalizador.get('fechaFin')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const tipo = this.formFiltrosDigitalizador.get('tipo')?.value;
        const fechaInicio = this.formFiltrosDigitalizador.get('fechaInicio')?.value;

        this.getGrupos({ fechaFin: fecha.toISOString().substring(0, 10), fechaInicio: fechaInicio?.toISOString().substring(0, 10), id_tipo_documento_digitalizacion: tipo });
        this.formFiltrosDigitalizador.get('grupo')?.reset();
        this.formFiltrosDigitalizador.get('nombres')?.reset();
      }
    });

    this.formFiltrosDigitalizador.get('grupo')?.valueChanges.subscribe(grupo => {
      if (grupo) {
        this.updateData();
      }
    });

    this.shouldDisableGrupo$.subscribe(shouldDisable => {
      const grupoControl = this.formFiltrosDigitalizador.get('grupo');
      shouldDisable ? grupoControl?.disable() : grupoControl?.enable();
    });
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

  myForm_Upload: FormGroup = this.fb.group({
    id_extension: ['', [Validators.required]],
    file: ''
  });

  myForm_Footer: FormGroup = this.fb.group({
    id_contenedor: ['', [Validators.required]],
  });

  get shouldDisableGrupo$(): Observable<boolean> {
    return combineLatest([
      this.formFiltrosDigitalizador.get('tipo')!.valueChanges,
      this.formFiltrosDigitalizador.get('fechaInicio')!.valueChanges,
      this.formFiltrosDigitalizador.get('fechaFin')!.valueChanges
    ]).pipe(
      map(([tipo, fechaInicio, fechaFin]) => {
        return tipo === '' || !fechaInicio || !fechaFin;
      }),
      distinctUntilChanged()
    );
  }

  toggleSeleccionarTodos(event: MatCheckboxChange, selectionRef: MatSelectionList) {
    if (event.checked) selectionRef.selectAll();
    else selectionRef.deselectAll();
  }

  toggleModalConfirmarCaratula() {
    this.showModalConfirmarCaratulas = !this.showModalConfirmarCaratulas;
    this.cdr.detectChanges();
  }

  toggleModalCaratula() {
    this.showModalCaratulas = !this.showModalCaratulas;
    this.cdr.detectChanges();
  }

  toggleModalConfiguraciones() {
    this.showModalConfiguraciones = !this.showModalConfiguraciones;

    if (this.showModalConfiguraciones) this.detenerMonitor();
  }

  toggleModalUploadEsperadosTipoArchivo() {
    this.showModalUploadEsperadosTipoArchivo = !this.showModalUploadEsperadosTipoArchivo;

    if (this.showModalUploadEsperadosTipoArchivo) this.detenerMonitor();
  }


  initializeChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.myBarChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.map(item => item.label), // Ajusta según tu estructura de datos
        datasets: [{
          label: 'Estado de digitalización',
          data: this.chartData.map(item => item.value), // Ajusta según tu estructura
          backgroundColor: [
            '#6B7280',
            '#6B7280',
            '#14B8A6',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            grid: {
              display: false,    // Quita las líneas verticales de la cuadrícula
            },
            ticks: {
              display: true,     // Muestra los números del eje X
              stepSize: 1
            }
          },
          y: {
            grid: {
              display: false,    // Quita las líneas horizontales de la cuadrícula
            },
            ticks: {
              display: true,     // Muestra los números del eje Y
              stepSize: 1,
            }
          }
        },
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

    this.chartData_construida = [
      {
        label: 'Esperadas',
        value: this.chartData[0]?.esperadas
      },
      {
        label: 'Digitalizadas',
        value: this.chartData[0]?.digitalizadas
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
      const nombre_archivo_upload = this.formFiltrosDigitalizador.get('grupo')?.value || '';

      if (nombre_archivo_upload != '') {
        this.digitalizarArchivosService.get_data_esperados_digitalizados(nombre_archivo_upload).subscribe({
          next: (response) => {
            if (response.data) {
              const { esperadas, enviadas_tisa } = response.data[0];
              this.digitalizarArchivosService.consultarCantidadDigitalizados(nombre_archivo_upload).then((cantidad) => {
                this.digitalizadas = cantidad;

                this.esperadas = esperadas;
                this.enviadas = enviadas_tisa;

                this.updateChartData(response.data.map((item: any) => {
                  return {
                    ...item,
                    digitalizadas: this.digitalizadas
                  }
                }));
                this.cdr.detectChanges();
              })
            } else {
              this.esperadas = 0;
              this.enviadas = 0;
            }
          },
          error: (error) => {
            this.esperadas = 0;
            this.enviadas = 0;
          }
        })
      }
    } catch (error) {
      this.esperadas = 0;
      this.enviadas = 0;
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
    const online = this.networkStatusService.checkConnection();

    if (!online) return;

    try {
      this.configDigitalizadorService.getTipos().subscribe({
        next: (response) => {
          this.configDigitalizadorService.syncTipos(response.data);
        },
        error: (error) => {
          console.log(error);
        }
      })

      this.digitalizarArchivosService.getGruposAll().subscribe({
        next: (response) => {
          this.configDigitalizadorService.syncGrupos(response.data);
        },
        error: (error) => {
          console.log(error);
        }
      })

      this.digitalizarArchivosService.getGruposAll().subscribe({
        next: (response) => {
          this.configDigitalizadorService.syncGrupos(response.data);
        },
        error: (error) => {
          console.log(error);
        }
      })

      const contenedores = await lastValueFrom(this.configDigitalizadorService.getContenedores());
      await this.configDigitalizadorService.syncLocalDataBase_Contenedores(contenedores.data);

      const extensiones = await lastValueFrom(this.configDigitalizadorService.getExtensiones());
      await this.configDigitalizadorService.syncLocalDataBase_Extensiones(extensiones.data);
    } catch (error) {
      console.error('Error en sincronización:', error);
      throw error; // Opcional: re-lanzar el error si quieres manejarlo fuera
    }
  }

  showDialog() {
    if (!this.electronService.isElectron) return;

    this.electronService.dialog
      ?.showOpenDialog({
        properties: ['openFile'],
      })
      .then((result) => {
        if (!result.canceled) {
          console.log('Archivo seleccionado:', result.filePaths[0]);
        }
      });

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
      // Obtenemos la ruta del directorio seleccionado
      // Nota: debido a restricciones de seguridad del navegador, solo obtenemos el nombre
      // del directorio, no la ruta completa del sistema de archivos
      this.sourcePath.set(input.files[0].webkitRelativePath.split('/')[0]);
    } else {
      // Caso cuando el directorio está vacío
      // Esto solo funciona en algunos navegadores
      const path = input.value;
      if (path.includes('\\')) {
        this.sourcePath.set(path.split('\\').slice(0, -1).join('\\'));
      } else if (path.includes('/')) {
        this.sourcePath.set(path.split('/').slice(0, -1).join('/'));
      }
    }
  }

  // Método para manejar la selección de la ruta de destino
  onDestinationPathSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.destinationPath.set(input.files[0].webkitRelativePath.split('/')[0]);
    } else {
      const path = input.value;
      if (path.includes('\\')) {
        this.destinationPath.set(path.split('\\').slice(0, -1).join('\\'));
      } else if (path.includes('/')) {
        this.destinationPath.set(path.split('/').slice(0, -1).join('/'));
      }
    }
  }

  // Método para guardar las rutas
  async saveConfig(): Promise<void> {
    this.toggleModalConfiguraciones();

    try {
      const rutaOrigen = this.formConfiguracion.get('rutaOrigen')?.value;
      const rutaDestino = this.formConfiguracion.get('rutaDestino')?.value;
      const extension = this.formConfiguracion.get('extension')?.value;
      const intervaloSincronizacion = this.formConfiguracion.get('intervaloSincronizacion')?.value;
      const pesoMinimo = this.formConfiguracion.get('pesoMinimo')?.value;
      const tipo = this.formConfiguracion.get('tipo')?.value;
      const regexCurp = this.formConfiguracion.get('regexCurp')?.value;

      // Guardar informacion de configuracion de digitalizador en la db Local
      this.configDigitalizadorService.localCreateOrUpdate_ConfigDigitalizador({
        ruta_digitalizados: rutaOrigen,
        ruta_enviados: rutaDestino,
        tiempo_sync: intervaloSincronizacion,
        extension: extension,
        peso_minimo: pesoMinimo,
        tipo: tipo,
        regexCurp: regexCurp,
      }).then(() => {
        this.sinConfiguracion = false;

        Swal.fire({
          title: 'Configuracion Almacenada Correctamente',
          icon: 'success',
          timer: 5000,
          showConfirmButton: false,
          confirmButtonText: 'Aceptar',
        })
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al obtener la configuración',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      console.error('Error al obtener configuración:', error);
    }
  }

  // Método para abrir el selector de archivos programáticamente
  openFileSelector(inputId: string): void {
    document.getElementById(inputId)?.click();
  }

  iniciarMonitor(): void {
    const intervalo = this.formConfiguracion.get('intervaloSincronizacion')?.value;

    this.monitorSubscription = interval(intervalo * 1000).subscribe(() => {
      this.procesarArchivos();
    });

    // Procesar inmediatamente al iniciar
    this.procesarArchivos();
    this.isMonitoring = true;
  }

  detenerMonitor(): void {
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
      this.isMonitoring = false;
    }
  }

  toggleMonitoreo() {
    if (this.sinConfiguracion)
      return this.detenerMonitor();

    if (this.isMonitoring)
      this.detenerMonitor();
    else
      this.iniciarMonitor();
  }

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

  tipos: any[] = [];
  contenedores: any[] = [];
  extensiones: any[] = [];

  getGrupos(body: { id_tipo_documento_digitalizacion: string, fechaInicio: string, fechaFin: string }): void {
    this.configDigitalizadorService
      .consultarGrupos(body)
      .then((grupos) => {
        this.grupos = grupos;
      })
      .catch((error) => console.error('Error al obtener los nombres archivos upload:', error));
  }

  getTipos(): void {
    this.configDigitalizadorService
      .consultarTipos()
      .then((tipos) => {
        this.tipos = tipos;
      })
      .catch((error) => console.error('Error al obtener tipos documentos digitalizacion:', error));
  }

  getGruposAll(): void {
    this.configDigitalizadorService
      .consultarTipos()
      .then((tipos) => {
        this.tipos = tipos;
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

  getSelectedValues(seleccionCaratulas: MatListOption[]): string[] {
    return seleccionCaratulas.map(
      (option: MatListOption) => option.value
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const extension = this.formConfiguracion.get('extension')?.value;
    const tipo = this.formConfiguracion.get('tipo')?.value;

    if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      this.lblUploadingFile = file.name;
      this.documentFile.file = file;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
      this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado

      this.importarExcel_ArchivosDigitalizar(this.documentFile.file, tipo, extension);
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
            this.mensaje = 'Datos importados exitosamente.';

            this.datosExcel = [];
            this.resetForm();

            Swal.fire({
              title: 'Importacion Generada con Éxito !!!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            this.syncDataBase();
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

  procesarArchivos(): void {
    const rutaOrigen = this.formConfiguracion.get('rutaOrigen')?.value;
    const rutaDestino = this.formConfiguracion.get('rutaDestino')?.value;
    const pesoMinimo = this.formConfiguracion.get('pesoMinimo')?.value;
    const extension = this.formConfiguracion.get('extension')?.value;
    const tipo = this.formConfiguracion.get('tipo')?.value;
    const regexCurp = this.formConfiguracion.get('regexCurp')?.value;

    this.digitalizarArchivosService.procesarArchivosBaseLocal(rutaOrigen, pesoMinimo, extension, tipo, regexCurp)
      .subscribe({
        next: (resultados) => {
        },
        error: (error) => {
          console.log(error);
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

  async selectFolder(field: 'rutaOrigen' | 'rutaDestino') {
    const folderPath = await this.electronService.selectFolder();
    if (folderPath) {
      this.formConfiguracion.get(field)?.setValue(folderPath);
    }
  }

  downloadPlantilla() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['NOMBRE_ARCHIVO']
    ]);

    // Crea un libro de trabajo y agrega la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Genera el archivo y lo descarga
    XLSX.writeFile(workbook, `plantilla_digitalizador.xlsx`);
  }

  getModulos(): void {
    this.modulosService.getModulos().subscribe({
      next: ((response) => {
        if (response.response) {
          this.modulos = response.data;
        }
      }),
      error: ((error) => {
      })
    });
  }

  getAtencionSinCita(body: Object): Observable<any> {
    return this.atencionSinCitaService.getCaratula(body).pipe(
      map(response => response?.data),
      catchError(error => throwError(error))
    );
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

  imprimirCaratulas(): void {
    const idModulo = this.formCaratula.get('id_modulo')?.value;
    const fecha = this.formCaratula.get('fecha')?.value;
    const curp = this.formCaratula.get('curp')?.value;

    if (idModulo === '') {
      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione un módulo',
        timer: 2000
      });
      return;
    }

    const body = {
      id_modulo: idModulo,
      fecha: fecha.toISOString().substring(0, 10)
    }

    if (this.activeTab === 0)
      this.getAtencionSinCita(body).subscribe({
        next: caratulas => {
          if (caratulas.length === 0) {
            Swal.fire({
              title: 'Atención',
              icon: 'warning',
              text: 'No hay atenciones sin cita para el día y módulo seleccionado',
              timer: 5000
            });
            return;
          }

          this.caratulas = caratulas;

          this.toggleModalCaratula();
          this.toggleModalConfirmarCaratula();
        },
        error: err => console.error('Error:', err)
      });
    else this.crearCaratula([curp]);
  }

  crearCaratula(caratulas: string[]): void {
    if (caratulas.length === 0) {
      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione al menos un registro',
        timer: 2000
      });
      return;
    }

    const doc = new jsPDF();

    caratulas.map(cita => {
      doc.text(cita, 50, 50);
      doc.addPage();
    })
    doc.deletePage(caratulas.length + 1);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    iframe.onload = function () {
      try {
        if (!iframe.contentWindow) {
          throw new Error("No se pudo acceder al contentWindow del iframe");
        }

        // Forzar el enfoque en el iframe para impresión
        iframe.contentWindow.focus();

        // Algunos navegadores necesitan un pequeño retraso
        setTimeout(() => {
          iframe.contentWindow?.print();

          // Limpiar después de imprimir
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      } catch (error) {
        console.error("Error al imprimir:", error);
        // Fallback: abrir en nueva ventana
        window.open(pdfUrl, '_blank');
      }
    };

    iframe.src = pdfUrl;
  }

  downloadXlsx(caratulas: string[]) {
    if (caratulas.length === 0) {
      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione al menos un registro',
        timer: 2000
      });
      return;
    }

    caratulas.unshift('NOMBRE_ARCHIVO');

    const worksheet = XLSX.utils.aoa_to_sheet(caratulas.map(caratula => [caratula]));
    const idModulo = this.formCaratula.get('id_modulo')?.value;
    const fecha = this.formCaratula.get('fecha')?.value;
    const horaImpresion = new Date().toTimeString().substring(0, 8).replaceAll(':', '');
    const modulo = this.modulos.find(modulo => modulo.id === idModulo);

    // Crea un libro de trabajo y agrega la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Carátulas');

    // Genera el archivo y lo descarga
    XLSX.writeFile(workbook, `${fecha.toISOString().substring(0, 10).replaceAll('-', '')}_${horaImpresion}_${modulo.nombre}.xlsx`);
  }
}
