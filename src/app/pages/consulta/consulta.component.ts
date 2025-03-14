import { ChangeDetectionStrategy, AfterViewInit, Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { environment } from '../../../environments/environment';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { NetworkStatusService } from '../../services/network-status.service';
import { AspirantesBeneficioService } from '../../services/CRUD/aspirantes-beneficio.service';
import { FotosService } from '../../services/CRUD/fotos.service';
import { UsersService } from '../../services/CRUD/users.service';
import { ModulosService } from '../../services/CRUD/modulos.service';
import { ModalidadesService } from '../../services/CRUD/modalidades.service';
import { StorageService } from '../../services/storage.service';
import { RouterLink } from '@angular/router';

export interface AspiranteBeneficio {
  id: string;
  name: string;
  progress: string;
  fruit: string;
}

@Component({
  selector: 'consultaPage',
  imports: [ReactiveFormsModule, DatePipe, CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatProgressSpinnerModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['curp', 'nombre_completo', 'nombre_modalidad', 'modulo', 'fecha_evento', 'email_cajero', 'telefono', 'email', 'fecha_nacimiento', 'estado', 'municipio', 'cp', 'colonia', 'domicilio', 'grado', 'tipo_carrera', 'carrera', 'acciones'];
  dataSource: MatTableDataSource<AspiranteBeneficio>;

  modulos: any[] = [];
  modalidades: any[] = [];
  cajeros: any[] = [];

  formConsulta: FormGroup;

  rolesConPermiso: number[] = [103, 104];
  rolesUsuario: Array<{ fkRole: number }> = [];

  currentPage: number = 0;
  lastPage: number = 1;
  perPage: number = 5;
  total: number = 0;

  loading: boolean = false;
  generado: boolean = false;

  readonly dialog = inject(MatDialog);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private modulosService: ModulosService,
    private modalidadesService: ModalidadesService,
    private usersService: UsersService,
    private storageService: StorageService) {
    this.dataSource = new MatTableDataSource();

    if (this.storageService.exists("perfiles"))
      this.rolesUsuario = this.storageService.get("perfiles");

    this.formConsulta = this.fb.nonNullable.group({
      search: '',
      modulo: '',
      modalidad: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
      cajero: ''
    });
  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) { }

    this.getAspirantesBeneficio();
    this.getModulos();
    this.getModalidades();
    this.getCajeros();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getAspirantesBeneficio(): void {
    const body = this.getBody(true);

    this.loading = true;

    this.aspirantesBeneficioService.getAspirantesBeneficioPaginated(body).subscribe({
      next: ((response) => {
        if (response.response) {
          this.dataSource.data = response.data;

          const { currentPage, lastPage, perPage, total } = response["pagination"];

          this.currentPage = currentPage - 1;
          this.lastPage = lastPage;
          this.perPage = perPage;
          this.total = total;
        }
      }),
      complete: () => {
        this.loading = false;
        this.generado = true;

        this.cdr.detectChanges();
      },
      error: ((error) => {
      })
    });
  }

  getModulos(): void {
    this.modulosService.getModulos().subscribe({
      next: ((response) => {
        if (response.response) {
          this.modulos = response.data;
        }
      }),
      complete: () => {
        this.cdr.detectChanges();
      },
      error: ((error) => {
      })
    });
  }
  getModalidades(): void {
    this.modalidadesService.getModalidades().subscribe({
      next: ((response) => {
        if (response.response) {
          this.modalidades = response.data.filter((modalidad: { id_tipo_beneficio: string }) => modalidad.id_tipo_beneficio == "2");
        }
      }),
      complete: () => {
        this.cdr.detectChanges();
      },
      error: ((error) => {
      })
    });
  }
  getCajeros(): void {
    this.usersService.getUsers().subscribe({
      next: ((response) => {
        if (response.response) {
          this.cajeros = response.data["usuarios_aspben"];
        }
      }),
      complete: () => {
        this.cdr.detectChanges();
      },
      error: ((error) => {
      })
    });
  }

  deleteAspiranteBeneficio(id: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Estas seguro de eliminar el registro?',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed)
        this.aspirantesBeneficioService.deleteAspiranteBeneficio(id).subscribe({
          next: ((response) => {
            Swal.fire('Eliminado con éxito!', '', 'success')
            this.getAspirantesBeneficio();
          }),
          error: ((error) => { })
        });
    })

  }

  onRowClick(event: MouseEvent, rowId: number) {
    // Verifica si el clic se realizó en la celda de acciones
    const isActionCell = (event.target as HTMLElement).closest('.action-cell');

    // Si no es la celda de acciones, abre el diálogo
    if (!isActionCell) {
      this.openDialog(rowId);
    }
  }

  openDialog(id: number) {
    this.dialog.open(DialogAspiranteBeneficio, {
      height: '600px',
      width: '800px',
      data: { id: id }
    });
  }

  get permisoAcciones(): boolean {
    // Verifica si algún perfil tiene un role que esté en el arreglo rolesConPermiso
    return this.rolesUsuario.some(perfil =>
      perfil.fkRole && this.rolesConPermiso.includes(Number(perfil.fkRole))
    );
  }

  limpiarCampos() {

  }

  downloadPdf() {
    const body = this.getBody();

    this.aspirantesBeneficioService.getAspirantesBeneficioAll(body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((aspirante: any) => {
          return [
            aspirante.curp,
            aspirante.nombre_completo,
            aspirante.nombre_modalidad,
            aspirante.grado,
            aspirante.modulo,
            aspirante.fecha_evento,
            aspirante.email_cajero
          ];
        });

        const doc = new jsPDF({ orientation: 'landscape' });
        autoTable(doc, {
          theme: 'grid',
          head: [[
            "CURP",
            "Nombre Completo",
            "Nombre Modalidad",
            "Grado",
            "Módulo",
            "Fecha Evento",
            "Email Cajero"
          ]],
          body: prepare,
          bodyStyles: { fontSize: 8 }
        });
        doc.save(`${this.getFileName()}`);
      }
    });
  }

  downloadExcel() {
    const body = this.getBody();

    this.aspirantesBeneficioService.getAspirantesBeneficioAll(body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((aspirante: any) => {
          return [
            aspirante.id,
            aspirante.id_modalidad,
            aspirante.curp,
            aspirante.nombre_completo,
            aspirante.nombre_modalidad,
            aspirante.modulo,
            aspirante.fecha_evento,
            aspirante.email_cajero,
            aspirante.telefono,
            aspirante.email,
            aspirante.fecha_nacimiento,
            aspirante.estado,
            aspirante.municipio,
            aspirante.ciudad,
            aspirante.cp,
            aspirante.colonia,
            aspirante.tipo_asentamiento,
            aspirante.tipo_zona,
            aspirante.domicilio,
            aspirante.grado,
            aspirante.tipo_carrera,
            aspirante.carrera,
            aspirante.com_obs,
          ];
        });

        prepare.unshift([
          "ID",
          "ID Modalidad",
          "CURP",
          "Nombre Completo",
          "Nombre Modalidad",
          "Módulo",
          "Fecha Evento",
          "Email Cajero",
          "Teléfono",
          "Email",
          "Fecha Nacimiento",
          "Estado",
          "Municipio",
          "Ciudad",
          "Código Postal",
          "Colonia",
          "Tipo Asentamiento",
          "Tipo Zona",
          "Domicilio",
          "Grado",
          "Tipo Carrera",
          "Carrera",
          "Comentarios / Observaciones"
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet(prepare);

        // Crea un libro de trabajo y agrega la hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Aspirantes');

        // Genera el archivo y lo descarga
        XLSX.writeFile(workbook, `${this.getFileName()}.xlsx`);
      }
    });
  }

  getFileName(): string {
    return "Aspirantes";
  }

  getBody(paginated: boolean = false): {
    search?: string;
    page?: number;
    per_page?: number;
  } {
    const _modulo = this.formConsulta.get('modulo')?.value,
      _modalidad = this.formConsulta.get('modalidad')?.value,
      _fechaInicio = this.formConsulta.get('fechaInicio')?.value,
      _fechaFin = this.formConsulta.get('fechaFin')?.value,
      _cajero = this.formConsulta.get('cajero')?.value,
      _search = this.formConsulta.get('search')?.value;

    const body: any = {}

    if (paginated) {
      body["per_page"] = this.perPage;
      body["page"] = this.currentPage + 1;
    }

    if (_modulo !== "") body['modulo'] = _modulo;
    if (_modalidad !== "") body['modalidad'] = _modalidad;
    if (_fechaInicio !== null) body['fechaInicio'] = _fechaInicio.toISOString().substring(0, 10);
    if (_fechaFin !== null) body['fechaFin'] = _fechaFin.toISOString().substring(0, 10);
    if (_cajero !== "") body['cajero'] = _cajero;
    if (_search !== "") body['search'] = _search;

    return body;
  }

  onPaginateChange(event: PageEvent): void {
    // Actualiza las variables según el evento del paginador
    this.currentPage = event.pageIndex; // Página actual (base 0)
    this.perPage = event.pageSize; // Tamaño de página seleccionado

    // Vuelve a cargar los datos
    this.getAspirantesBeneficio();
  }
}

@Component({
  selector: 'dialog-aspirante-beneficio',
  templateUrl: 'dialog-aspirante-beneficio.html',
  imports: [
    DatePipe,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogAspiranteBeneficio implements OnInit {
  readonly data = inject<{ id: number }>(MAT_DIALOG_DATA);
  readonly id = Number(this.data.id);

  aspiranteBeneficio: any = {};
  aspiranteBeneficioFoto: string = "";

  loadingStatusCredencializado: boolean = false;

  constructor(
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private fotosService: FotosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.getAspiranteBeneficioId();
  }

  getAspiranteBeneficioId(): void {
    this.aspirantesBeneficioService.getAspiranteBeneficioId(this.id).subscribe({
      next: (response) => {
        this.aspiranteBeneficio = response.data;
        this.cdr.detectChanges();

        this.getAspiranteFotoId(this.aspiranteBeneficio.id_foto);
      },
      error: (error) => {
        console.error('Error al obtener los datos del aspirante:', error);
      }
    });
  }

  getAspiranteFotoId(id: number): void {
    this.aspiranteBeneficioFoto = 'assets/default-profile.png';

    this.fotosService.getAspiranteFotoId(id).subscribe({
      next: (response) => {
        if (response.response)
          this.aspiranteBeneficioFoto = environment.baseUrl + '/' + response.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener los datos del aspirante:', error);
      }
    });
  }

  editAspiranteCredencializado(event: MatSlideToggleChange): void {
    this.loadingStatusCredencializado = true;

    this.aspirantesBeneficioService.editAspiranteCredencializado(this.aspiranteBeneficio, event.checked).subscribe({
      next: (response) => {
        this.aspiranteBeneficio = response.data;
        this.loadingStatusCredencializado = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener los datos del aspirante:', error);
      }
    });
  }
}
