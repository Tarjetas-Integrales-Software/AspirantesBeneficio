import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, } from "@angular/forms"
import { CamaraComponent } from '../../components/camara/camara.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { StorageService } from '../../services/storage.service';
import { AsistenciaService } from '../../services/CRUD/asistencia.service';
import { CajerosFotosService } from '../../services/CRUD/cajeros-fotos.service';
import { RelacionAsistenciaFotosService } from '../../services/CRUD/relacion-asistencia-fotos.service';
import { ModulosService } from '../../services/CRUD/modulos.service';

export interface Asistencia {
  id: number;
  usuario: string;
  fecha_hora_entrada: string;
  fecha_hora_salida: string;
  id_foto_entrada: number;
  id_foto_salida: number;
}

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
  dataSource = new MatTableDataSource<Asistencia>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('camaraComponent') camaraComponent!: CamaraComponent;

  constructor(private fb: FormBuilder,
    private storageService: StorageService,
    private asistenciaService: AsistenciaService,
    private cajerosFotosService: CajerosFotosService,
    private relacionAsistenciaFotosService: RelacionAsistenciaFotosService,
    private modulosService: ModulosService) {
    this.myForm = this.fb.group({
      modulo: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.getAsistencias();
    this.getModulos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  getAsistencias(): void {
    if (!this.storageService.exists("user")) return;

    const user = this.storageService.get("user");

    this.asistenciaService.getAsistenciasUsuario(user.iduser).subscribe({
      next: ((response) => {
        if (response.response) {
          this.dataSource.data = response.data;
        }
      }),
      complete: () => {
      },
      error: ((error) => {
      })
    })

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

  async registrar(): Promise<void> {
    if (!this.storageService.exists("user")) return;

    const user = this.storageService.get("user");
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19).padEnd(23, '.000');
    const fileName = user.email + '-' + currentDate.substring(0, 19).replaceAll(':', '').replace(' ', '_');

    const [nuevaAsistencia, nuevaFoto] = await Promise.all([
      this.registrarAsistencia(currentDate, user),
      this.registrarFoto(currentDate, fileName)
    ]);

    await this.registrarRelacionAsistenciaFoto(nuevaAsistencia, nuevaFoto);

    this.camaraComponent.savePhoto(fileName, 'imagenesAsistencia');
  }

  async registrarAsistencia(currentDate: string, user: { iduser: number }): Promise<any> {
    try {
      return await this.asistenciaService.localCreateAsistencia({
        id_user: user.iduser,
        fecha_hora: currentDate,
        id_tipo: 1
      });
    } catch (error) {
      console.error('Error al guardar la asistencia en la base de datos local:', error);
      return null;
    }
  }

  async registrarFoto(currentDate: string, fileName: string): Promise<any> {
    try {
      return await this.cajerosFotosService.localCreateFoto({
        id_status: 1,
        fecha: currentDate,
        tipo: 'asistencia',
        archivo: fileName,
        path: 'fotoscajerosaspirantesbeneficio/' + fileName + '.webp',
        archivoOriginal: 'captured_photo.webp',
        extension: 'webp'
      });
    } catch (error) {
      console.error('Error al guardar la foto en la base de datos local:', error);
      return null;
    }
  }

  async registrarRelacionAsistenciaFoto(asistencia: { lastInsertRowid: number }, cajero_foto: { lastInsertRowid: number }): Promise<any> {
    try {
      return await this.relacionAsistenciaFotosService.localCreateRelacion({
        id_asistencia: asistencia.lastInsertRowid,
        id_cajero_foto: cajero_foto.lastInsertRowid,
        id_status: 1,
      });
    } catch (error) {
      console.error('Error al guardar la relación en la base de datos local:', error);
      return null;
    }
  }

  isValidField(fieldName: string): boolean | null {
    return (this.myForm.controls[fieldName].errors && this.myForm.controls[fieldName].touched);
  }
}
