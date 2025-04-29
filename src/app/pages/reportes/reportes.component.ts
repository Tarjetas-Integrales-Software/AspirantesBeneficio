import { ChangeDetectionStrategy, AfterViewInit, Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

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

import { NetworkStatusService } from '../../services/network-status.service';
import { AspirantesBeneficioService } from '../../services/CRUD/aspirantes-beneficio.service';
import { ReportesService } from './reportes.service';

export interface AspiranteBeneficio {
  id: string;
  name: string;
  progress: string;
  fruit: string;
}

export interface Reporte {
  id: number;
  nombre: string;
  nombre_procedimiento: string;
  route: string;
  descripcion: string;
  created_id: number | null;
  updated_id: number | null;
  deleted_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

@Component({
  selector: 'reportesPage',
  imports: [ReactiveFormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatProgressSpinnerModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<AspiranteBeneficio>;

  reportes: Reporte[] = []

  formConsulta: FormGroup;

  currentPage: number = 0;
  lastPage: number = 1;
  perPage: number = 5;
  total: number = 0;

  loading: boolean = false;
  generado: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private networkStatusService: NetworkStatusService,
    private aspirantesBeneficioService: AspirantesBeneficioService,
    private reportesService: ReportesService,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource();

    this.formConsulta = this.fb.group({
      reporte: [''],
      fechaInicio: [new Date()],
      fechaFin: [new Date()],
    });
  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) { }

    this.getReportes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getReporte(): void {
    const url = this.getUrlReporte();
    const body = this.getBody(true);

    this.loading = true;

    this.reportesService.getReporte(url, body).subscribe({
      next: ((response) => {
        if (response.response) {
          const primerElemento = response.data[0] || {};

          this.displayedColumns = Object.keys(primerElemento);

          this.dataSource.data = response.data;
          this.dataSource.paginator = this.paginator;
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

  getReportes(): void {
    this.reportesService.getReportes().subscribe({
      next: ((response) => {
        if (response.response) {
          this.reportes = response.data;
        }
      }),
      complete: () => {
      },
      error: ((error) => {
      })
    });
  }

  downloadPdf() {
    const url = this.getUrlReporte();
    const body = this.getBody();

    this.reportesService.getReporte(url, body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((item: any) => {
          return Object.values(item);
        });

        const doc = new jsPDF({ orientation: 'landscape' });
        autoTable(doc, {
          theme: 'grid',
          head: [[...this.displayedColumns]],
          body: prepare,
          bodyStyles: { fontSize: 8 }
        });
        doc.save(`${this.getFileName()}`);
      }
    });
  }

  downloadExcel() {
    const url = this.getUrlReporte();
    const body = this.getBody();

    this.reportesService.getReporte(url, body).subscribe(response => {
      if (response["response"]) {
        const prepare = response["data"].map((item: any) => {
          return Object.values(item);
        });

        prepare.unshift([...this.displayedColumns]);

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
    return this.getUrlReporte();
  }

  getBody(paginated: boolean = false): {
    search?: string;
    page?: number;
    per_page?: number;
  } {
    const _fechaInicio = this.formConsulta.get('fechaInicio')?.value;
    const _fechaFin = this.formConsulta.get('fechaFin')?.value;

    const body: any = {}

    if (paginated) {
      body["per_page"] = this.perPage;
      body["page"] = this.currentPage + 1;
    }

    if (_fechaInicio !== "") body['fecha_inicio'] = _fechaInicio.toISOString().substring(0, 10);
    if (_fechaFin !== "") body['fecha_fin'] = _fechaFin.toISOString().substring(0, 10);

    return body;
  }

  getUrlReporte(): string {
    return this.formConsulta.get('reporte')?.value;
  }

  onPaginateChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.perPage = event.pageSize;

    this.getReporte();
  }
}
