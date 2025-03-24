import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, } from "@angular/forms"
import { ModulosService } from '../../services/CRUD/modulos.service';
import { CamaraComponent } from '../../components/camara/camara.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface PeriodicElement {
  id: number;
  usuario: string;
  fecha_hora_entrada: string;
  fecha_hora_salida: string;
  id_foto_entrada: number;
  id_foto_salida: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { id: 1, usuario: 'Hydrogen', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 11, id_foto_salida: 21 },
  { id: 2, usuario: 'Helium', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 12, id_foto_salida: 22 },
  { id: 3, usuario: 'Lithium', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 13, id_foto_salida: 23 },
  { id: 4, usuario: 'Beryllium', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 14, id_foto_salida: 24 },
  { id: 5, usuario: 'Boron', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 15, id_foto_salida: 25 },
  { id: 6, usuario: 'Carbon', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 16, id_foto_salida: 26 },
  { id: 7, usuario: 'Nitrogen', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 17, id_foto_salida: 27 },
  { id: 8, usuario: 'Oxygen', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 18, id_foto_salida: 28 },
  { id: 9, usuario: 'Fluorine', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 19, id_foto_salida: 29 },
  { id: 10, usuario: 'Neon', fecha_hora_entrada: "09:00", fecha_hora_salida: "09:00", id_foto_entrada: 20, id_foto_salida: 30 },
];

@Component({
  selector: 'app-asistencia',
  imports: [
    CommonModule,
    CamaraComponent,
    MatInputModule,
    MatFormFieldModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginator
  ],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.scss'
})
export class AsistenciaComponent implements OnInit {
  myForm: FormGroup;

  modulos: any[] = [];

  displayedColumns: string[] = ['usuario', 'fecha_hora_entrada', 'fecha_hora_salida'];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private fb: FormBuilder, private modulosService: ModulosService) {
    this.myForm = this.fb.group({
      modulo: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.getModulos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  getModulos(): void {
    this.modulosService.getModulos().subscribe({
      next: ((response) => {
        if (response.response) {
          this.modulos = response.data;
        }
      }),
      complete: () => {
      },
      error: ((error) => {
      })
    });
  }

  isValidField(fieldName: string): boolean | null {
    return (this.myForm.controls[fieldName].errors && this.myForm.controls[fieldName].touched);
  }
}
