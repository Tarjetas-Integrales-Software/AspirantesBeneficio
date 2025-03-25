import {
  ChangeDetectionStrategy,
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
  ElementRef,
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
import { AspirantesAprobadosService } from '../../services/CRUD/aspirantes-aprobados.service';
import { CurpAprobadaSsas, CurpsAprobadasSsasService } from '../../services/CRUD/curps-aprobadas-ssas.service';

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

  rolesConPermisoAdmin: number[] = [104];
  rolesConPermisoOperador: number[] = [103, 104];
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
    private utilService: UtilService,
    private aspirantesAprobadosService: AspirantesAprobadosService,
    private curpsAprobadasSsasService: CurpsAprobadasSsasService

  ) {
    this.dataSource = new MatTableDataSource();

    if (this.storageService.exists('perfiles'))
      this.rolesUsuario = this.storageService.get('perfiles');

    this.formImpresion = this.fb.nonNullable.group({
      impresora: '',
      search: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
      file: ''
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

  get permisoAccionesOperador(): boolean {
    // Verifica si algún perfil tiene un role que esté en el arreglo rolesConPermiso
    return this.rolesUsuario.some(
      (perfil) =>
        perfil.fkRole && this.rolesConPermisoOperador.includes(Number(perfil.fkRole))
    );
  }

  get permisoAccionesAdmin(): boolean {
    // Verifica si algún perfil tiene un role que esté en el arreglo rolesConPermiso
    return this.rolesUsuario.some(
      (perfil) =>
        perfil.fkRole && this.rolesConPermisoAdmin.includes(Number(perfil.fkRole))
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
    const photoPath = await this.getAspiranteFotoId(aspirante.id_foto);

    try {
      ipcRenderer.send('print-id-card', {
        ...aspirante,
        photoPath: photoPath,
        printer: this.selectedPrinter
      });

      this.editAspiranteImpreso(aspirante);

      Swal.fire({
        title: 'Impresion Generada con Éxito !!!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
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

  editAspiranteImpreso(aspiranteBeneficio: AspiranteBeneficio): void {
    this.aspirantesBeneficioService.editAspiranteImpreso(aspiranteBeneficio, true).subscribe({
      next: (response) => {
        this.getAspirantesBeneficio();
      },
      error: (error) => {
        console.error('Error al obtener los datos del aspirante:', error);
      }
    });
  }

  // EXPORTAR A EXCEL Y PDF

  getFileName(): string {
    return "AspirantesAprobados";
  }

  downloadPdf() {
    const body = this.getBody();

    this.aspirantesAprobadosService.getAspirantesAprobadosAll(body).subscribe(response => {
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

    this.aspirantesAprobadosService.getAspirantesAprobadosAll(body).subscribe(response => {
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



  //IMPORTAR EXCEL
  lblUploadingFile: string = '';
  documentFileLoaded: boolean = false;
  documentFile: any = {
    file: '',
    archivos: []
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log(file,'file');
    if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      this.lblUploadingFile = file.name;
      this.documentFile.file = file;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(file); // Eliminar esta línea
      this.documentFileLoaded = true; // Marcar que el archivo ha sido cargado

      console.log(this.documentFile,'this.documentFile');
      console.log(this.documentFile.file,'this.documentFile.file');

      this.importarExcel(this.documentFile.file);

    } else {
      Swal.fire('Error', 'Solo se permiten archivos EXCEL', 'error');
      this.lblUploadingFile = '';
      this.documentFile.file = null;
      // No establecer el valor del campo de entrada de archivo directamente
      // this.formCita.get('file')?.setValue(null); // Eliminar esta línea
      this.documentFileLoaded = false; // Marcar que no hay archivo cargado
    }
  }

  async importarExcel(file: any) {
    const archivo = file; //event.target.files[0];
    if (archivo) {
      this.datosExcel = await this.utilService.leerExcel(archivo);
      console.log('Datos Cargados:', this.datosExcel);
    }

    this.subirDatos();
  }

  subirDatos() {
    if (this.datosExcel.length === 0) {
      this.mensaje = 'No hay datos para enviar.';
      return;
    }

    this.curpsAprobadasSsasService.BulkInsertCurpAprobadaSsas_InBatches(this.datosExcel).subscribe({
      next: (res) => {
        console.log('Respuesta del servidor:', res);
        this.mensaje = 'Datos importados exitosamente.';

        this.datosExcel = [];
        this.resetForm();

        Swal.fire({
          title: 'Importacion Generada con Éxito !!!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });




      },
      error: (err) => {
        console.error('Error al enviar los datos:', err);
        this.mensaje = 'Hubo un error al importar los datos.';
        Swal.fire({
          title: 'Ocurrio un Error en la Importacion',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  @ViewChild('fileInput') fileInput!: ElementRef;

  resetForm() {
    this.formImpresion.reset();
    this.lblUploadingFile = '';
    this.fileInput.nativeElement.value = ''; // Resetear solo el input file
  }

  deleteCurpAprobada(id: number): void {
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
              this.getAspirantesBeneficio();
            }),
            error: ((error) => { })
          });
      })

    }


}
