import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { switchMap, filter, take } from 'rxjs/operators';
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, } from "@angular/forms"
import { CamaraComponent } from '../../components/camara/camara.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { StorageService } from '../../services/storage.service';
import { AsistenciaService } from '../../services/CRUD/asistencia.service';
import { CajerosFotosService } from '../../services/CRUD/cajeros-fotos.service';
import { RelacionAsistenciaFotosService } from '../../services/CRUD/relacion-asistencia-fotos.service';
import { ModulosService } from '../../services/CRUD/modulos.service';
import { LoginService } from '../../login/login.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { UsersService } from '../../services/CRUD/users.service';

import Swal from 'sweetalert2';

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
    MatPaginator,
    MatSlideToggleModule
  ],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.scss'
})
export class AsistenciaComponent implements OnInit {
  myForm: FormGroup;

  modulos: any[] = [];

  displayedColumns: string[] = ['nombre_modulo', 'fecha', 'hora_entrada', 'hora_salida'];
  dataSource = new MatTableDataSource<Asistencia>([]);

  loading: boolean = false;
  errorMessage: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('camaraComponent') camaraComponent!: CamaraComponent;

  constructor(private fb: FormBuilder,
    private storageService: StorageService,
    private asistenciaService: AsistenciaService,
    private cajerosFotosService: CajerosFotosService,
    private relacionAsistenciaFotosService: RelacionAsistenciaFotosService,
    private modulosService: ModulosService,
    private loginService: LoginService,
    private networkStatusService: NetworkStatusService,
    private usersService: UsersService) {
    this.myForm = this.fb.group({
      modulo: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      tipo: [this.tipoAsistencia()]
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

    this.asistenciaService.getHistoricoAsistenciasUser(user.iduser).subscribe({
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

    const idModulo = this.myForm.get('modulo')?.value;
    const idTipo = this.myForm.get('tipo')?.value;

    if (!idModulo) return;

    const user = this.storageService.get("user");

    const fullDate = new Date();
    const time = fullDate.toTimeString().substring(0, 8) + '.000';
    const date = fullDate.toJSON().substring(0, 10);

    const currentDate = date + ' ' + time;
    const fileName = user.email + '-' + currentDate.substring(0, 19).replaceAll(':', '').replace(' ', '_');

    const [nuevaAsistencia, nuevaFoto] = await Promise.all([
      await this.registrarAsistencia(currentDate, user, idModulo, idTipo),
      await this.registrarFoto(currentDate, fileName)
    ]);

    await this.registrarRelacionAsistenciaFoto(nuevaAsistencia, nuevaFoto);

    this.camaraComponent.savePhoto(fileName, 'imagenesAsistencia');
    Swal.fire('Asistencia registrada!', '', 'success');

    this.checkAndSyncAsistencias();
  }

  async registrarAsistencia(currentDate: string, user: { iduser: number }, idModulo: number, idTipo: boolean): Promise<any> {
    try {
      return await this.asistenciaService.localCreateAsistencia({
        id_user: user.iduser,
        id_modulo: idModulo,
        id_tipo: idTipo ? 2 : 1,
        fecha_hora: currentDate,
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
        archivo: fileName + '.webp',
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

  comprobarClave(): void {
    if (this.networkStatusService.checkConnection()) {
      if (this.myForm.invalid || this.loading) return;
      if (!this.storageService.exists("user")) return;

      const user = this.storageService.get("user");
      const { password } = this.myForm.value;

      this.loading = true;
      this.loginService.login({ email: user.email, password: password.trim() }).subscribe(
        async (response) => {
          if (response.response) {
            await this.registrar();
          } else Swal.fire(response.message, '', 'warning');
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          Swal.fire('Clave incorrecta. Por favor, inténtelo de nuevo.', '', 'warning');
        }
      );
    } else {
      // aqui entra en caso de no haber conexion para validar el user y password en la db local
      const { email, password } = this.myForm.value;
      this.usersService.ValidaUsuarioPorEmailyPassEnLocal(email, password)
        .then(async (existe: boolean) => {
          if (existe) {
            await this.registrar();
          } else {
            Swal.fire('Clave incorrecta. Por favor, inténtelo de nuevo.', '', 'warning');
          }
        })
    }
  }

  tipoAsistencia(): boolean {
    const ahora = new Date();
    const horas = ahora.getHours();

    return !(horas >= 0 && horas < 12);
  }

  private checkAndSyncAsistencias(): void {
    this.networkStatusService.isOnline.pipe(
      take(1),
      filter(isOnline => isOnline),
      filter(() => this.storageService.exists("token"))
    ).subscribe(() => {
      this.actualizarAsistencias();
    });
  }

  async actualizarAsistencias(): Promise<void> {
    try {
      const items = await this.relacionAsistenciaFotosService.consultarRelacionesDesincronizadas();

      for (const relacion of items) {
        const { id_asistencia, id_cajero_foto } = relacion;

        try {
          const asistencia = await this.asistenciaService.consultarAsistenciaPorId(id_asistencia);
          const foto = await this.cajerosFotosService.consultarFotoPorId(id_cajero_foto);

          let nuevaAsistencia = {};
          let nuevaFoto = {};
          let nuevoIdAsistencia: number | null = null;
          let nuevoIdFoto: number | null = null;

          // Crear aspirante y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.asistenciaService.createAsistencia(asistencia).subscribe({
              next: async (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdAsistencia = response.data.id;
                  nuevaAsistencia = response.data;
                }

                resolve();
              },
              error: (error) => {
                console.error("Error al crear aspirante:", error);
                reject(error);
              }
            });
          });

          // Crear foto y obtener su ID
          await new Promise<void>((resolve, reject) => {
            this.cajerosFotosService.createFoto(foto).subscribe({
              next: (response) => {
                if (response.response && response.data?.id !== undefined) {
                  nuevoIdFoto = response.data.id;
                  nuevaFoto = response.data;
                }
                resolve();
              },
              error: (error) => {
                console.error("Error al crear foto:", error);
                reject(error);
              }
            });
          });

          // Verificamos que los IDs sean números válidos antes de crear la relación
          if (typeof nuevoIdAsistencia === "number" && typeof nuevoIdFoto === "number") {
            const nuevaRelacion = {
              id_asistencia: nuevoIdAsistencia,
              id_cajero_foto: nuevoIdFoto
            };

            this.relacionAsistenciaFotosService.createRelacion(nuevaRelacion).subscribe({
              next: (response) => {
                if (response.response) {
                  this.relacionAsistenciaFotosService.eliminarRelacion(relacion.id);

                  this.cajerosFotosService.registerPhoto(nuevaAsistencia, nuevaFoto)
                }
              },
              error: (error) => {
                this.eliminarRelacionadosAsistencia(nuevoIdAsistencia, nuevoIdFoto);

                console.error("Error al crear relación:", error);
              }
            });
          } else {
            console.error("No se pudo crear la relación porque faltan IDs válidos");

            this.eliminarRelacionadosAsistencia(nuevoIdAsistencia, nuevoIdFoto);
          }
        } catch (error) {
          console.error("Error obteniendo aspirante o foto:", error);
        }
      }
    } catch (error) {
      console.error("Error consultando relaciones:", error);
    }
  }

  eliminarRelacionadosAsistencia(nuevoIdAsistencia: null | number, nuevoIdFoto: null | number): void {
    if (typeof nuevoIdAsistencia === "number") this.asistenciaService.deleteAsistencia(nuevoIdAsistencia).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdAsistencia = null;
      },
      error: (error) => {
        console.error("Error al eliminar asistencia:", error);
      }
    });

    if (typeof nuevoIdFoto === "number") this.cajerosFotosService.deleteFoto(nuevoIdFoto).subscribe({
      next: async (response) => {
        if (response.response && response.data?.id !== undefined) nuevoIdFoto = null;
      },
      error: (error) => {
        console.error("Error al eliminar asistencia:", error);
      }
    });
  }
}
