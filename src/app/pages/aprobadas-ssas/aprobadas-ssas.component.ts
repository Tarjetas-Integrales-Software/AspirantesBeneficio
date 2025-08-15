import { ChangeDetectionStrategy, AfterViewInit, Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

import { EditDialogComponent } from './edit-dialog/edit-dialog.component';

import { NetworkStatusService } from '../../services/network-status.service';
import { AspirantesBeneficioService } from '../../services/CRUD/aspirantes-beneficio.service';
import { FotosService } from '../../services/CRUD/fotos.service';
import { UsersService } from '../../services/CRUD/users.service';
import { ModulosService } from '../../services/CRUD/modulos.service';
import { ModalidadesService } from '../../services/CRUD/modalidades.service';
import { StorageService } from '../../services/storage.service';
import { CurpsAprobadasSsasService } from '../../services/CRUD/curps-aprobadas-ssas.service'
import { UtilService } from '../../services/util.service';

export interface CurpAprobadaSsas {
  id: number;
  curp: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  modulo: string;
  telefono: string;
  celular: string;
  modalidad: string | null;
  fpu: string | null;
  created_id: string;
  updated_id: string | null;
  deleted_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

@Component({
  selector: 'app-aprobadas-ssas',
  imports: [ReactiveFormsModule, DatePipe, CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatProgressSpinnerModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, RouterLink],
  templateUrl: './aprobadas-ssas.component.html',
  styleUrl: './aprobadas-ssas.component.scss'
})
export class AprobadasSsasComponent {
  displayedColumns: string[] = ['curp', 'nombre', 'apellido_paterno', 'apellido_materno', 'modalidad', 'fpu', 'modulo', 'telefono', 'celular', 'created_at', 'created_id', 'updated_at', 'updated_id', 'acciones'];
  dataSource: MatTableDataSource<CurpAprobadaSsas>;

  modulos: any[] = [];
  modalidades: any[] = [];

  editingRow: number | null = null;

  editForm!: FormGroup;
  formConsulta: FormGroup;

  rolesConPermiso: number[] = [103, 104];
  rolesUsuario: Array<{ fkRole: number }> = [];

  currentPage: number = 0;
  lastPage: number = 1;
  perPage: number = 5;
  total: number = 0;

  loading: boolean = false;
  generado: boolean = false;

  lblUploadingFile: string = '';
  documentFileLoaded: boolean = false;
  documentFile: any = {
    file: '',
    archivos: []
  }

  datosExcel: any[] = [];
  mensaje: string = '';

  readonly dialog = inject(MatDialog);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private networkStatusService: NetworkStatusService,
    private modulosService: ModulosService,
    private modalidadesService: ModalidadesService,
    private usersService: UsersService,
    private storageService: StorageService,
    private curpsAprobadasSsasService: CurpsAprobadasSsasService,
    private utilService: UtilService,
  ) {
    this.dataSource = new MatTableDataSource();

    if (this.storageService.exists("perfiles"))
      this.rolesUsuario = this.storageService.get("perfiles");

    this.formConsulta = this.fb.nonNullable.group({
      search: '',
      modulo: '',
      modalidad: '',
    });
  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) { }

    this.getCurpsAprovadasSsas();
    this.getModulos();
    this.getModalidades();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getCurpsAprovadasSsas(): void {
    const body = this.getBody(true);

    this.loading = true;

    this.curpsAprobadasSsasService.getPaginated(body).subscribe({
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
        this.curpsAprobadasSsasService.deleteCurpAprobada(id).subscribe({
          next: ((response) => {
            Swal.fire('Eliminado con éxito!', '', 'success')
            this.getCurpsAprovadasSsas();
          }),
          error: ((error) => { })
        });
    })

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

    this.curpsAprobadasSsasService.getAll(body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((aspirante: any) => {
          return [
            aspirante.curp, aspirante.nombre, aspirante.apellido_paterno, aspirante.apellido_materno, aspirante.modalidad, aspirante.fpu, aspirante.modulo, aspirante.telefono, aspirante.celular, aspirante.created_at, aspirante.created_id, aspirante.updated_at, aspirante.updated_id,
          ];
        });

        const doc = new jsPDF({ orientation: 'landscape' });
        autoTable(doc, {
          theme: 'grid',
          head: [[
            'CURP', 'Nombre', 'Apellido paterno', 'Apellido materno', 'Modalidad', 'FPU', 'Módulo', 'Teléfono', 'Celular', 'created_at', 'created_id', 'updated_at', 'updated_id'
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

    this.curpsAprobadasSsasService.getAll(body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((aspirante: any) => {
          return [
            aspirante.curp, aspirante.nombre, aspirante.apellido_paterno, aspirante.apellido_materno, aspirante.modalidad, aspirante.fpu, aspirante.modulo, aspirante.telefono, aspirante.celular, aspirante.created_at, aspirante.created_id, aspirante.updated_at, aspirante.updated_id,
          ];
        });

        prepare.unshift([
          'CURP', 'Nombre', 'Apellido paterno', 'Apellido materno', 'Modalidad', 'FPU', 'Módulo', 'Teléfono', 'Celular', 'created_at', 'created_id', 'updated_at', 'updated_id'
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet(prepare);

        // Crea un libro de trabajo y agrega la hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Aprobadas');

        // Genera el archivo y lo descarga
        XLSX.writeFile(workbook, `${this.getFileName()}.xlsx`);
      }
    });
  }

  downloadPlantilla() {
    const prepare = [
      [
        'CURP', 'NOMBRE', 'PATERNO', 'MATERNO', 'TELEFONO', 'CELULAR', 'CELULAR', 'MODALIDAD', 'FPU', 'MODULO'
      ]
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(prepare);

    // Crea un libro de trabajo y agrega la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Genera el archivo y lo descarga
    XLSX.writeFile(workbook, `plantillaCargaAprobados.xlsx`);
  }

  getFileName(): string {
    return "CURPs aprobadas SSAS";
  }

  getBody(paginated: boolean = false): {
    search?: string;
    page?: number;
    per_page?: number;
  } {
    const _modulo = this.formConsulta.get('modulo')?.value,
      _modalidad = this.formConsulta.get('modalidad')?.value,
      _search = this.formConsulta.get('search')?.value;

    const body: any = {}

    if (paginated) {
      body["per_page"] = this.perPage;
      body["page"] = this.currentPage + 1;
    }

    if (_modulo !== "") body['modulo'] = _modulo;
    if (_modalidad !== "") body['modalidad'] = _modalidad;
    if (_search !== "") body['search'] = _search;

    return body;
  }

  onPaginateChange(event: PageEvent): void {
    // Actualiza las variables según el evento del paginador
    this.currentPage = event.pageIndex; // Página actual (base 0)
    this.perPage = event.pageSize; // Tamaño de página seleccionado

    // Vuelve a cargar los datos
    this.getCurpsAprovadasSsas();
  }

  editRow(row: CurpAprobadaSsas) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '500px',
      data: { row, modulos: this.modulos.map(m => m.nombre), modalidades: this.modalidades.map(m => m.nombre) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.dataSource.data.findIndex(d => d.id === result.id);

        this.curpsAprobadasSsasService.edit(result).subscribe({
          next: (response) => {
            if (response.response) {
              Swal.fire('Actualizado con éxito!', '', 'success');
              this.dataSource.data[index] = result;
            } else {
              Swal.fire('Error', 'No se pudo actualizar el registro', 'error');
            }
          },
          error: (error) => {
            Swal.fire('Error', 'Ocurrió un error al actualizar el registro', 'error');
          }
        })
      }
    });
  }

  // importar curps aprobadas
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log(file, 'file');
    if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      this.lblUploadingFile = file.name;
      this.documentFile.file = file;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
      this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado

      this.importarExcel_v2(this.documentFile.file);

    } else {
      Swal.fire('Error', 'Solo se permiten archivos EXCEL', 'error');
      this.lblUploadingFile = '';
      this.documentFile.file = null;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(null); // Eliminar esta línea
      this.documentFileLoaded = false; // Marcar que no hay archivo cargado
    }
  }

  async importarExcel_v2(file: any) {
    const archivo = file; //event.target.files[0];
    if (archivo) {
      await this.utilService.leerExcel_v2(archivo).then(
        (response) => {
          if (response) {
            console.log('Respuesta del servidor:', response);
            this.mensaje = 'Datos importados exitosamente.';

            this.datosExcel = [];

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
}
