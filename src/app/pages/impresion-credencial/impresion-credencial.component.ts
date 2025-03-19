import {
  ChangeDetectionStrategy,
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
const { ipcRenderer } = (window as any).require('electron');
import { FormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NetworkStatusService } from '../../services/network-status.service';
import { AspirantesBeneficioService } from '../../services/CRUD/aspirantes-beneficio.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FotosService } from '../../services/CRUD/fotos.service';
import { StorageService } from '../../services/storage.service';
import { UtilService } from '../../services/util.service';

export interface AspiranteBeneficio {
  id: number;
  id_foto: string;
  name: string;
  progress: string;
  fruit: string;
}

@Component({
  selector: 'app-impresion-credencial',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    DatePipe,
    MatNativeDateModule,
  ],
  templateUrl: './impresion-credencial.component.html',
  styleUrl: './impresion-credencial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpresionCredencialComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'impreso',
    'curp',
    'nombre_completo',
    'nombre_modalidad',
    'modulo',
    'fecha_evento',
    'email_cajero',
    'telefono',
    'acciones',
  ];
  dataSource: MatTableDataSource<AspiranteBeneficio>;

  printers: any[] = [];
  selectedPrinter: string = '';

  formImpresion: FormGroup;

  rolesConPermiso: number[] = [103, 104];
  rolesUsuario: Array<{ fkRole: number }> = [];

  aspiranteBeneficioFoto: string = "";

  currentPage: number = 0;
  lastPage: number = 1;
  perPage: number = 5;
  total: number = 0;

  loading: boolean = false;
  generado: boolean = false;

  readonly dialog = inject(MatDialog);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  datosExcel: any[] = [];
  mensaje: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private fotosService: FotosService,
    private storageService: StorageService,
    private utilService: UtilService
  ) {
    this.dataSource = new MatTableDataSource();

    if (this.storageService.exists('perfiles'))
      this.rolesUsuario = this.storageService.get('perfiles');

    this.formImpresion = this.fb.nonNullable.group({
      impresora: '',
      search: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
    });
  }

  ngOnInit() {
    const online = this.networkStatusService.checkConnection();
    if (online) {
    }
    this.getAspirantesBeneficio();
    this.getPrinters();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getAspirantesBeneficio(): void {
    const body = this.getBody(true);

    this.loading = true;

    this.aspirantesBeneficioService
      .getAspirantesBeneficioAprobadosPaginated(body)
      .subscribe({
        next: (response) => {
          if (response.response) {
            this.dataSource.data = response.data;

            const { currentPage, lastPage, perPage, total } =
              response['pagination'];

            this.currentPage = currentPage - 1;
            this.lastPage = lastPage;
            this.perPage = perPage;
            this.total = total;
          }
        },
        complete: () => {
          this.loading = false;
          this.generado = true;

          this.cdr.detectChanges();
        },
        error: (error) => { },
      });
  }

  get permisoAcciones(): boolean {
    // Verifica si algún perfil tiene un role que esté en el arreglo rolesConPermiso
    return this.rolesUsuario.some(
      (perfil) =>
        perfil.fkRole && this.rolesConPermiso.includes(Number(perfil.fkRole))
    );
  }

  limpiarCampos() { }

  getBody(paginated: boolean = false): {
    search?: string;
    page?: number;
    per_page?: number;
  } {
    const _fechaInicio = this.formImpresion.get('fechaInicio')?.value,
      _fechaFin = this.formImpresion.get('fechaFin')?.value,
      _search = this.formImpresion.get('search')?.value;

    const body: any = {};

    if (paginated) {
      body['per_page'] = this.perPage;
      body['page'] = this.currentPage + 1;
    }

    if (_fechaInicio !== null)
      body['fechaInicio'] = _fechaInicio.toISOString().substring(0, 10);
    if (_fechaFin !== null)
      body['fechaFin'] = _fechaFin.toISOString().substring(0, 10);
    if (_search !== '') body['search'] = _search;

    return body;
  }

  onPaginateChange(event: PageEvent): void {
    // Actualiza las variables según el evento del paginador
    this.currentPage = event.pageIndex; // Página actual (base 0)
    this.perPage = event.pageSize; // Tamaño de página seleccionado

    // Vuelve a cargar los datos
    this.getAspirantesBeneficio();
  }

  async getPrinters() {
    this.printers = await ipcRenderer.invoke('get-printers');
    console.log(this.printers.length, 'printer-lenght');
    if (this.printers.length > 0) {
      this.selectedPrinter = this.printers[0].name;
      console.log(this.printers, 'printers');
    }
  }

  async print(aspirante: AspiranteBeneficio) {
    console.log(aspirante,'aspirante');
    const photoPath = await this.getAspiranteFotoId(aspirante.id_foto);
    console.log(photoPath);

    try {
      ipcRenderer.send('print-id-card', {
        ...aspirante,
        photoPath: photoPath,
        printer: this.selectedPrinter
      });

      this.editAspiranteCredencializado(aspirante);
    } catch (error) {
      console.error('Ocurrió un error:', error);
    }
  }

  async getAspiranteFotoId(id: string): Promise<string> {
    this.aspiranteBeneficioFoto = 'assets/default-profile.png';

    try {
      const response = await this.fotosService.getAspiranteFotoId(id).toPromise();

      if (response && response.response) {
        this.aspiranteBeneficioFoto = environment.baseUrl + '/' + response.data;
      }

      this.cdr.detectChanges();
      return this.aspiranteBeneficioFoto;
    } catch (error) {
      console.error('Error al obtener los datos del aspirante:', error);
      throw error;
    }
  }

  editAspiranteCredencializado(aspiranteBeneficio: AspiranteBeneficio): void {
    this.aspirantesBeneficioService.editAspiranteCredencializado(aspiranteBeneficio, true).subscribe({
      next: (response) => {
        this.getAspirantesBeneficio();
      },
      error: (error) => {
        console.error('Error al obtener los datos del aspirante:', error);
      }
    });
  }

  async cargarArchivo(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.datosExcel = await this.utilService.leerExcel(archivo);
      console.log('Datos Cargados:', this.datosExcel);
    }
  }

  subirDatos() {
    if (this.datosExcel.length === 0) {
      this.mensaje = 'No hay datos para enviar.';
      return;
    }

    this.utilService.enviarDatosAlServidor(this.datosExcel).subscribe({
      next: (res) => {
        console.log('Respuesta del servidor:', res);
        this.mensaje = 'Datos importados exitosamente.';
      },
      error: (err) => {
        console.error('Error al enviar los datos:', err);
        this.mensaje = 'Hubo un error al importar los datos.';
      }
    });
  }


}
