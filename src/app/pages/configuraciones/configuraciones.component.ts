import { Component, OnInit, inject, Output, EventEmitter, signal } from "@angular/core"
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from "@angular/common"
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, } from "@angular/forms"
import { ConfiguracionesService } from "../../services/CRUD/configuraciones.service";
import { ModulosService } from "../../services/CRUD/modulos.service";
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { Router } from "@angular/router";
import { MenuService } from "../../services/CRUD/menu.service";
import { StorageService } from "../../services/storage.service";
import { RelacionUsuarioRolesService } from "../../services/CRUD/relacion-usuario-roles.service";


@Component({
  selector: 'app-configuraciones',
  imports: [
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDatepickerModule,
    MatCardModule,
  ],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.scss'
})
export class ConfiguracionesComponent implements OnInit {
  @Output() submitForm = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  opcionesMenu = signal<any[]>([]);

  modulos: any[] = [];
  selectedValue_modu: string = '';

  rolesUsuario: Array<{ fkRole: number }> = [];
  rolesConPermisoMenu_Asistencia: number[] = [106];
  rolesConPermisoMenu_Registro: number[] = [108];
  rolesConPermisoMenu_Consulta: number[] = [109];
  rolesConPermisoMenu_Reportes: number[] = [110];
  rolesConPermisoMenu_Impresion: number[] = [111];
  rolesConPermisoMenu_ImpresionManual: number[] = [112];
  rolesConPermisoMenu_Digitalizador: number[] = [113];

  constructor(
    private modulosService: ModulosService,
    private configuracionesService: ConfiguracionesService,
    private menuService: MenuService,
    private storageService: StorageService,
    private relacionUsuarioRolesService: RelacionUsuarioRolesService
  ) {
    if (this.storageService.exists('user')) {
      const user = this.storageService.get('user');
      const { iduser } = user;

      this.relacionUsuarioRolesService.consultarRolesPorUsuario(iduser).then(roles => this.rolesUsuario = roles);
    }
  }

  myForm: FormGroup = this.fb.group({
    modulo: ['', [Validators.required, Validators.minLength(5)]],

  });

  ngOnInit() {
    this.getModulosAspben()
  }

  async getModulosAspben() {
    this.modulosService.consultarModulos()
      .then(modulos => {
        this.modulos = modulos;
      })
      .catch(error => console.error('Error al obtener modulos:', error));
  }

  selectedValue_modulo() {
    this.selectedValue_modu = this.myForm.get('modulo')?.value;
  }

  isValidField(fieldName: string): boolean | null {
    return (this.myForm.controls[fieldName].errors && this.myForm.controls[fieldName].touched);
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

  redirigirModulo(): void {
    this.menuService.getOpcionesMenuLocal().then((opcionesMenu) => {
      if (opcionesMenu) {
        // Crear un mapa para acceder fácilmente a las opciones por su clave
        const menuOptions: { [key: string]: string } = {};

        // Mapear todas las opciones de menú
        opcionesMenu.forEach((option: any) => {
          menuOptions[option.clave] = option.valor;
        });

        // Navegación basada en permisos
        if (menuOptions['menu_habilitar_registro'] == '1' && this.permisoMenu_Registro) {
          this.router.navigate(['/inicio/registro']);
        } else if (menuOptions['menu_habilitar_consulta'] == '1' && this.permisoMenu_Consulta) {
          this.router.navigate(['/inicio/consulta']);
        } else if (menuOptions['menu_habilitar_asistencia'] == '1' && this.permisoMenu_Asistencia) {
          this.router.navigate(['/inicio/asistencia']);
        } else if (menuOptions['menu_habilitar_reportes'] == '1' && this.permisoMenu_Reportes) {
          this.router.navigate(['/inicio/reportes']);
        } else if (menuOptions['menu_habilitar_impresion'] == '1' && this.permisoMenu_Impresion) {
          this.router.navigate(['/inicio/impresion-credencial']);
        } else if (menuOptions['menu_habilitar_impr_manual'] == '1' && this.permisoMenu_ImpresionManual) {
          this.router.navigate(['/inicio/impresion-manuales']);
        } else if (menuOptions['menu_habilitar_cortes'] == '1') {
          this.router.navigate(['/inicio/cortes']);
        } else if (menuOptions['menu_habilitar_digitalizacion'] == '1' && this.permisoMenu_Digitalizador) {
          this.router.navigate(['/inicio/digitalizacion']);
        } else
          Swal.fire('Sin acceso', 'No tienes acceso a ningún módulo del sistema - online -', 'warning');
      } else {
        Swal.fire('Error', 'No se pudieron cargar las opciones del menú', 'error');
      }
    }
    );
  }

  async onSubmit(): Promise<void> {
    this.selectedValue_modu = this.myForm.get('modulo')?.value;

    if (this.selectedValue_modu === '') {
      Swal.fire({
        title: 'Selecciona un módulo!',
        icon: 'warning',
        timer: 1500,
        showConfirmButton: true,
      });
      return;
    };

    try {
      this.configuracionesService.insertOrUpdateConfiguracion('modulo', this.selectedValue_modu).then(() => {
        Swal.fire({
          title: 'Actualización exitosa!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.redirigirModulo();
        });
      });
    } catch (error) {
      console.error('Error al guardar la configuracion en la base de datos local:', error);
      Swal.fire({
        title: 'Error al guardar la configuracion en la base de datos local',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    }
    this.submitForm.emit();
  }

  get permisoMenu_Registro(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Registro.includes(Number(perfil.fkRole))); }
  get permisoMenu_Consulta(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Consulta.includes(Number(perfil.fkRole))); }
  get permisoMenu_Reportes(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Reportes.includes(Number(perfil.fkRole))); }
  get permisoMenu_Asistencia(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Asistencia.includes(Number(perfil.fkRole))); }
  get permisoMenu_Impresion(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Impresion.includes(Number(perfil.fkRole))); }
  get permisoMenu_ImpresionManual(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_ImpresionManual.includes(Number(perfil.fkRole))); }
  get permisoMenu_Digitalizador(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Digitalizador.includes(Number(perfil.fkRole))); }
}
