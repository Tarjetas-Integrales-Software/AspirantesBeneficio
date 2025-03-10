import { ChangeDetectionStrategy, AfterViewInit, Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

import Swal from 'sweetalert2'

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [DatePipe, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['curp', 'nombre_completo', 'telefono', 'email', 'fecha_nacimiento', 'estado', 'municipio', 'cp', 'colonia', 'domicilio', 'fecha_evento', 'acciones'];
  dataSource: MatTableDataSource<AspiranteBeneficio>;

  rolesConPermiso: number[] = [103, 104];
  rolesUsuario: Array<{ pkUserPerfil: number }> = [];

  readonly dialog = inject(MatDialog);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private networkStatusService: NetworkStatusService, private aspirantesBeneficioService: AspirantesBeneficioService, private storageService: StorageService) {
    this.dataSource = new MatTableDataSource();

    if (this.storageService.exists("perfiles"))
      this.rolesUsuario = this.storageService.get("perfiles");
  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) { }

    this.getAspirantesBeneficio();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getAspirantesBeneficio(): void {
    this.aspirantesBeneficioService.getAspirantesBeneficio().subscribe({
      next: ((response) => {
        this.dataSource.data = response.data;
      }),
      error: ((error) => { })
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
      perfil.pkUserPerfil && this.rolesConPermiso.includes(Number(perfil.pkUserPerfil))
    );
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
    MatDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogAspiranteBeneficio implements OnInit {
  readonly data = inject<{ id: number }>(MAT_DIALOG_DATA);
  readonly id = Number(this.data.id);

  aspiranteBeneficio: any = {};
  aspiranteBeneficioFoto: string = "";

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
}
