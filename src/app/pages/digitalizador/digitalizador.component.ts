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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Chart, registerables } from 'chart.js';
import { ElectronService } from '../../services/electron.service';
import Swal from 'sweetalert2';
import { ConfigDigitalizadorService } from '../../services/CRUD/config-digitalizador.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { UtilService } from '../../services/util.service';
import { DigitalizarArchivosService } from '../../services/CRUD/digitalizar-archivos.service';
import { ModulosLicitacionService } from '../../services/CRUD/modulos-licitacion.service';
import { AtencionSinCitaService } from '../../services/CRUD/atencion-sin-cita.service';
import { ArchivosNoCargadosService } from './../../services/CRUD/archivos-no-cargados.service';
import { ConfiguracionService } from '../../services/CRUD/configuracion.service';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { arch } from 'os';

const electronAPI = (window as any).electronAPI;

const path = electronAPI?.path;
const fs = electronAPI?.fs;

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
    MatSlideToggleModule,
  ],
  templateUrl: './digitalizador.component.html',
  styleUrl: './digitalizador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalizadorComponent implements OnInit, OnDestroy {
  private appPath: string = '';

  @ViewChild('myBarChart') myBarChart!: ElementRef;
  chart!: Chart;
  chartData: any[] = [];
  chartData_construida: any[] = [];

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
  imprimiendo: boolean = false;

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

  atencionSinCitaDetalles: any[] = [];

  archivosEsperados: { id: number, nombre_archivo: string, status: number }[] = [];
  archivosPendientesEnviar: any[] = [];

  activeTab: number = 0;

  esperadas: number = 0;
  digitalizadas: number = 0;
  enviadas: number = 0;

  private intervaloArchivosNoCargados: Subscription = new Subscription();
  private updateSubscription: Subscription = new Subscription();
  private isAlive = true; // Flag para controlar la suscripción

  constructor(
    private cdr: ChangeDetectorRef,
    private electronService: ElectronService,
    private configDigitalizadorService: ConfigDigitalizadorService,
    private networkStatusService: NetworkStatusService,
    private utilService: UtilService,
    private digitalizarArchivosService: DigitalizarArchivosService,
    private modulosLicitacionService: ModulosLicitacionService,
    private atencionSinCitaService: AtencionSinCitaService,
    private archivosNoCargadosService: ArchivosNoCargadosService,
    private configuracionService: ConfiguracionService,
  ) {
    const electronAPI = (window as any).electronAPI;

    this.loadAppPath();

    const CURP_REGEX = new RegExp(
      '^[A-Z][AEIOU][A-Z]{2}[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z][0-9]$'
    );

    this.path = electronAPI?.path;
    this.fs = electronAPI?.fs;

    this.formCaratula = this.fb.nonNullable.group({
      impresora: '',
      fecha: new Date(),
      id_modulo: '',
      curp: [''],
    });

    this.formFiltrosDigitalizador = this.fb.nonNullable.group({
      tipo: '',
      grupo: { value: '', disabled: true },
      fecha: new Date(),
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
      regexCurp: /([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0\d|1[0-2])(?:[0-2]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d)/,
      qr: false,
      barras: false,
    });

    Chart.register(...registerables); // Registra todos los componentes de Chart.js
  }

  private async loadAppPath(): Promise<void> {
    try {
      if (window.electronAPI?.getAppPath)
        this.appPath = await window.electronAPI.getAppPath();
      else
        this.appPath = '';
    } catch (error) {
      console.log(error);
    }
  }

  async ngOnInit() {
    const online = this.networkStatusService.checkConnection();

    if (online) {
      try {
        const today = new Date().toISOString().substring(0, 10);

        await this.syncDataBase();

        this.configuracionService.consultar().then((intervalos) => {
          const configuraciones = this.utilService.mapearConfiguraciones(intervalos);

          const {
            syncInterval,
            syncCurpInterval,
            syncDocumentosInterval,
            syncMonitorInterval,
            syncAsistenciaInterval,
            syncArchivosDigitalizadosInterval,
            syncCargarArchivosPendientesInterval
          } = configuraciones;

          if (syncCargarArchivosPendientesInterval.activo) this.syncCargarArchivosNoCargados(syncCargarArchivosPendientesInterval.intervalo * 1000 * 60);
        })


        this.getContenedores();
        this.getExtensiones();
        this.getArchivosEsperados();
        this.getAtencionSinCitaDetalle({ fecha: today });

        this.initializeChart();

        // Carga inicial
        this.updateData();

        this.updateSubscription = interval(1 * 1000 * 60)
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

    const { extension, peso_minimo, ruta_digitalizados, ruta_enviados, tiempo_sync, tipo, regex_curp, qr, barras } = await config

    this.formConfiguracion = this.fb.nonNullable.group({
      extension: extension,
      rutaOrigen: ruta_digitalizados,
      rutaDestino: ruta_enviados,
      intervaloSincronizacion: tiempo_sync,
      pesoMinimo: peso_minimo,
      tipo: tipo,
      regexCurp: regex_curp,
      qr: Boolean(qr),
      barras: Boolean(barras)
    });

    this.formFiltrosDigitalizador.get('tipo')?.valueChanges.subscribe(tipoId => {
      if (tipoId) {
        const fecha = this.formFiltrosDigitalizador.get('fecha')?.value;

        this.getGrupos({ id_tipo_documento_digitalizacion: tipoId, fecha: fecha?.toISOString().substring(0, 10) });
        this.formFiltrosDigitalizador.get('grupo')?.reset();
        this.formFiltrosDigitalizador.get('nombres')?.reset();
      }
    });

    this.formFiltrosDigitalizador.get('fecha')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const tipo = this.formFiltrosDigitalizador.get('tipo')?.value;

        this.getGrupos({ fecha: fecha.toISOString().substring(0, 10), id_tipo_documento_digitalizacion: tipo });
        this.getAtencionSinCitaDetalle({ fecha: fecha.toISOString().substring(0, 10) });
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
    fecha_expediente: ['', [Validators.required]],
    id_extension: ['', [Validators.required]],
    file: ''
  });

  myForm_Footer: FormGroup = this.fb.group({
    id_contenedor: ['', [Validators.required]],
  });

  get shouldDisableGrupo$(): Observable<boolean> {
    return combineLatest([
      this.formFiltrosDigitalizador.get('tipo')!.valueChanges,
      this.formFiltrosDigitalizador.get('fecha')!.valueChanges,
    ]).pipe(
      map(([tipo, fecha]) => {
        return tipo === '' || !fecha;
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

  cancelarConfirmarCaratula() {
    this.toggleModalConfirmarCaratula();
    this.toggleModalCaratula();
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

        this.digitalizarArchivosService.getArchivosPendientesEnviar(nombre_archivo_upload).subscribe({
          next: (response) => {
            if (response.response) {
              this.archivosPendientesEnviar = response.data;
              this.cdr.detectChanges();
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
      const qr = this.formConfiguracion.get('qr')?.value;
      const barras = this.formConfiguracion.get('barras')?.value;

      // Guardar informacion de configuracion de digitalizador en la db Local
      this.configDigitalizadorService.localCreateOrUpdate_ConfigDigitalizador({
        ruta_digitalizados: rutaOrigen,
        ruta_enviados: rutaDestino,
        tiempo_sync: intervaloSincronizacion,
        extension: extension,
        peso_minimo: pesoMinimo,
        tipo: tipo,
        regexCurp: regexCurp,
        qr: qr ? 1 : 0,
        barras: barras ? 1 : 0,
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
    this.formCaratula.get('curp')?.setValue(input.value);
  }

  tipos: any[] = [];
  contenedores: any[] = [];
  extensiones: any[] = [];

  getGrupos(body: { id_tipo_documento_digitalizacion: string, fecha: string }): void {
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

  // Método para formatear
  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Meses son 0-based
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onFileSelected(event: any): void {
    const fecha_expediente = this.myForm_Upload.get('fecha_expediente')?.value;

    if (fecha_expediente) {
      // Formatea la fecha a YYYY-MM-DD
      const fechaFormateada = this.formatDateToYYYYMMDD(fecha_expediente);

      const file = event.target.files[0];
      const extension = this.formConfiguracion.get('extension')?.value;
      const tipo = this.formConfiguracion.get('tipo')?.value;

      if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        this.lblUploadingFile = file.name;
        this.documentFile.file = file;
        // No establecer el valor del campo de entrada de archivo directamente
        // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
        this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado

        this.importarExcel_ArchivosDigitalizar(this.documentFile.file, tipo, extension, fechaFormateada);
      } else {
        Swal.fire('Error', 'Solo se permiten archivos EXCEL', 'error');
        this.lblUploadingFile = '';
        this.documentFile.file = null;
        // No establecer el valor del campo de entrada de archivo directamente
        // this.formCita.get('file')?.setValue(null); // Eliminar esta línea
        this.documentFileLoaded = false; // Marcar que no hay archivo cargado
      }

    } else {

      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione una fecha de expediente',
        timer: 2500
      });
      return;
    }


  }

  async importarExcel_ArchivosDigitalizar(file: any, tipo_doc: number, ext: string, fecha: string) {
    const archivo = file; //event.target.files[0];
    if (archivo) {
      await this.utilService.leerExcel_ArchivosDigitalizar(archivo, tipo_doc, ext, fecha).then(
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
    this.modulosLicitacionService.getModulos().subscribe({
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

  getAtencionSinCitaDetalle(body: { fecha: string }): void {
    const { fecha } = body;

    this.atencionSinCitaService.getDetalle({
      fecha: fecha,
    }).subscribe({
      next: (response) => {
        if (response.response) this.atencionSinCitaDetalles = response.data;
        else this.atencionSinCitaDetalles.length = 0;

        this.cdr.detectChanges();
      },
      error: () => { },
    })
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
    const impresora = this.formCaratula.get('impresora')?.value;
    const idModulo = this.formCaratula.get('id_modulo')?.value;
    const fecha = this.formCaratula.get('fecha')?.value;
    const curp = this.formCaratula.get('curp')?.value;

    if (impresora === '') {
      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione una impresora',
        timer: 2500
      });
      return;
    }

    if (this.activeTab === 0) {
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
    } else this.crearCaratula([curp]);
  }

  async crearCaratula(caratulas: string[]): Promise<void> {
    if (this.imprimiendo) return;

    this.imprimiendo = true;

    if (!window.electronAPI) {
      throw new Error('Funcionalidad de impresión solo disponible en Electron');
      this.imprimiendo = false;
    }

    if (caratulas.length === 0) {
      Swal.fire({
        title: 'Advertencia',
        icon: 'warning',
        text: 'Seleccione al menos un registro',
        timer: 2000
      });

      this.imprimiendo = false;
      return;
    }

    caratulas.sort();

    const config =
      await this.configDigitalizadorService.consultarConfigDigitalizador();

    if (config === undefined) {
      this.sinConfiguracion = true;

      this.detenerMonitor();
      this.isMonitoring = false;

      this.imprimiendo = false;
      return;
    } else this.sinConfiguracion = false;

    const { qr, barras } = await config
    const impresora = this.formCaratula.get('impresora')?.value;

    const doc = new jsPDF();

    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 30;
    const marginEnd = 15;

    doc.setFontSize(28);

    // Constantes de layout
    const qrWidth = 70;
    const barcodeWidth = qrWidth;
    const barcodeHeight = 20;

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = (pageWidth - qrWidth) / 2;

    for (const cita of caratulas) {
      doc.text(cita, 50, 40);

      // Agregar QR centrado
      if (Boolean(qr)) {
        try {
          const qrUrl = await QRCode.toDataURL(cita);
          doc.addImage(qrUrl, 'PNG', centerX, 70, qrWidth, qrWidth, cita, 'FAST', 0);
        } catch (err) {
          console.error('Error generando QR:', err);
        }
      }

      // Agregar código de barras centrado debajo del QR
      if (Boolean(barras)) {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, cita, {
            format: 'CODE128',
            displayValue: false,
            width: barcodeWidth / 90 * 2, // ajusta para que encaje en 90 px
            height: barcodeHeight,
            margin: 0
          });

          const barcodeUrl = canvas.toDataURL('image/png');

          const x = pageWidth - barcodeWidth - marginEnd; // esquina derecha
          const y = pageHeight - barcodeHeight - marginBottom; // parte inferior

          doc.addImage(barcodeUrl, 'PNG', x, y, barcodeWidth, barcodeHeight);

          canvas.width = 0;
          canvas.height = 0;
        } catch (err) {
          console.error('Error generando código de barras:', err);
        }
      }

      doc.addPage();
    }

    doc.deletePage(caratulas.length + 1); // elimina la última página vacía

    const pdfBuffer = doc.output('arraybuffer');
    const respuestaPrint = await window.electronAPI.print(pdfBuffer, impresora);

    Swal.fire({
      title: 'Aviso',
      text: respuestaPrint,
      timer: 3500,
      icon: 'success'
    }).then(() =>
      this.imprimiendo = false
    )
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

  syncCargarArchivosNoCargados(intervalo: number) {
    this.intervaloArchivosNoCargados = interval(intervalo)
      .pipe(takeWhile(() => this.isAlive))
      .subscribe(async () => {
        const carpetaInterna = path.join(this.appPath, 'archivosDigitalizados');
        const config =
          await this.configDigitalizadorService.consultarConfigDigitalizador();

        const { extension, peso_minimo } = await config;

        const archivos = await this.listarArchivos(carpetaInterna, peso_minimo, extension);

        if (archivos.length === 0) return;

        const nombresArchivos: string[] = archivos.map(archivo => {
          const [curp, _] = path.basename(archivo).split('.');

          return curp;
        })

        const fecha = this.formFiltrosDigitalizador.get('fecha')?.value;
        const tiempo = fecha.toTimeString().replaceAll(":", '').substring(0, 6);
        const fechaParseada = this.formatDateToYYYYMMDD(fecha);
        const tipoDocumento = 1;
        const grupo = 'NO-REGISTRADOS';

        const body = nombresArchivos.map((nombre: string) => {
          return {
            extension: extension,
            fecha_expediente: fechaParseada,
            id_tipo_documento_digitalizacion: tipoDocumento,
            nombre_archivo: nombre,
            nombre_archivo_upload: `${fechaParseada.replaceAll('-', '')}_${tiempo}_${grupo}`,
          }
        });

        this.archivosNoCargadosService.insertarNoCargados({ registros: body }).subscribe({
          next: (res) => {
            console.log(res);

          },
          error: (error) => {

          },
        })
      });
  }

  async capturarArchivosNoCargados(): Promise<void> {

  }

  private async listarArchivos(
    carpetaInterna: string,
    pesoMinimo: number | null,
    extension: string | null
  ): Promise<string[]> {
    try {
      const electronAPI = (window as any).electronAPI;

      if (!fs.existsSync(carpetaInterna)) {
        fs.mkdirSync(carpetaInterna, { recursive: true });
      }

      return await electronAPI.invoke('get-filtered-files', {
        folder: carpetaInterna,
        minSize: pesoMinimo,
        extension: extension || undefined
      });
    } catch (error) {
      console.error('Error al obtener archivos:', error);
      return [];
    }
  }
}
