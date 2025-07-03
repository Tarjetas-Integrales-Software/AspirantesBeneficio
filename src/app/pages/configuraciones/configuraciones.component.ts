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

  constructor(private modulosService: ModulosService
    , private configuracionesService: ConfiguracionesService
    , private menuService: MenuService
  ) { }

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

  getOpcionesMenu() {
    this.menuService.getOpcionesMenuLocal().then((opcionesMenu) => {
      this.opcionesMenu.set(opcionesMenu);
      this.menuService.syncMenuOptionsLocal(opcionesMenu);
    })
  }

  async onSubmit(): Promise<void> {
    try {
      this.selectedValue_modu = this.myForm.get('modulo')?.value;
      await this.configuracionesService.insertOrUpdateConfiguracion('modulo', this.selectedValue_modu);
      Swal.fire({
        title: 'Actualización exitosa!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {

        if (this.opcionesMenu().length > 0) {
          const menuOptions: { [key: string]: string } = {};
          this.opcionesMenu().forEach((option: any) => {
            menuOptions[option.clave] = option.valor;
          });
          if (menuOptions['menu_habilitar_registro'] === '1') {
            this.router.navigate(['/inicio/registro']);
          } else if (menuOptions['menu_habilitar_consulta'] === '1') {
            this.router.navigate(['/inicio/consulta']);
          } else if (menuOptions['menu_habilitar_asistencia'] === '1') {
            this.router.navigate(['/inicio/asistencia']);
          } else if (menuOptions['menu_habilitar_reportes'] === '1') {
            this.router.navigate(['/inicio/reportes']);
          } else if (menuOptions['menu_habilitar_impresion'] === '1') {
            this.router.navigate(['/inicio/impresion-credencial']);
          } else if (menuOptions['menu_habilitar_impr_manual'] === '1') {
            this.router.navigate(['/inicio/impresion-manuales']);
          } else if (menuOptions['menu_habilitar_cortes'] === '1') {
            this.router.navigate(['/inicio/cortes']);
          } else if (menuOptions['menu_habilitar_digitalizacion'] === '1') {
            this.router.navigate(['/inicio/digitalizacion']);
          } else {
            // Si no tiene ningún permiso, mostrar un mensaje
            Swal.fire('Sin acceso', 'No tienes acceso a ningún módulo del sistema - configuraciones -', 'warning');
          }
        } else {
          // Si no hay opciones de menú, redirigir a la página de inicio
          this.router.navigate(['/inicio']);
        }
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

}
