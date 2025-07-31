import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core"
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from "@angular/common"
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, } from "@angular/forms"
import { ConfiguracionService } from "../../services/CRUD/configuracion.service";
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';


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
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatCardModule,
    MatSlideToggleModule,
  ],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.scss'
})
export class ConfiguracionesComponent implements OnInit {
  private fb = inject(FormBuilder);

  formConfiguraciones: FormGroup;

  constructor(
    private configuracionService: ConfiguracionService,
    private cdr: ChangeDetectorRef,
  ) {
    this.formConfiguraciones = this.fb.nonNullable.group({
      enableSyncInterval: [true],
      syncInterval: [{ value: 60, disabled: false }, [Validators.required]],

      enableSyncCurpInterval: [true],
      syncCurpInterval: [{ value: 30, disabled: false }, [Validators.required]],

      enableSyncDocumentosInterval: [true],
      syncDocumentosInterval: [{ value: 3, disabled: false }, [Validators.required]],

      enableSyncMonitorInterval: [true],
      syncMonitorInterval: [{ value: 9, disabled: false }, [Validators.required]],

      enableSyncAsistenciaInterval: [true],
      syncAsistenciaInterval: [{ value: 30, disabled: false }, [Validators.required]],

      enableSyncArchivosDigitalizadosInterval: [true],
      syncArchivosDigitalizadosInterval: [{ value: 2, disabled: false }, [Validators.required]],

      enableSyncCargarArchivosPendientesInterval: [true],
      syncCargarArchivosPendientesInterval: [{ value: 5, disabled: false }, [Validators.required]],
    });

    this.llenarFormulario();
  }


  ngOnInit(): void {

  }

  toggleField(toggleControl: string, targetControl: string) {
    this.formConfiguraciones.get(toggleControl)?.valueChanges.subscribe(enabled => {
      const control = this.formConfiguraciones.get(targetControl);
      if (enabled) {
        control?.enable();
      } else {
        control?.disable();
      }

      this.cdr.detectChanges();
    });
  }

  isValidField(fieldName: string): boolean | null {
    return (this.formConfiguraciones.controls[fieldName].errors && this.formConfiguraciones.controls[fieldName].touched);
  }

  getFieldError(fieldName: string): string | null {
    if (!this.formConfiguraciones.controls[fieldName].errors) return null;

    const errors = this.formConfiguraciones.controls[fieldName].errors ?? {};

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

  onSubmit(): void {
    const configuracion = this.formConfiguraciones.getRawValue();

    const mensaje = this.procesarConfiguraciones(configuracion);

    Swal.fire({
      title: 'Información',
      text: mensaje,
      icon: 'warning',
      timer: 1500,
      showConfirmButton: true,
    });
  }

  procesarConfiguraciones(config: any): string {
    Object.keys(config).forEach(key => {
      if (key.startsWith('sync') && key.endsWith('Interval')) {
        const nombre = key;
        const intervalo = config[nombre];

        // Buscar la clave 'enableSync...Interval' correspondiente
        const enableKey = `enable${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
        const activo = config.hasOwnProperty(enableKey) && config[enableKey] ? 1 : 0;

        this.configuracionService.actualizarPorNombre({
          nombre,
          intervalo,
          activo
        });
      }
    });

    return 'Guardado con éxito';
  }

  llenarFormulario(): void {
    this.configuracionService.consultar().then((configuraciones: any[]) => {
      const form: { [key: string]: any } = {};

      configuraciones.forEach(conf => {
        const nombre = conf.nombre;
        const enableKey = `enable${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;

        const isEnabled = conf.activo === 1;

        form[enableKey] = [conf.activo === 1];
        form[nombre] = [{ value: conf.intervalo, disabled: !isEnabled }, [Validators.required]];

        this.toggleField(enableKey, nombre);
      });

      // Crear el formulario dinámicamente basado en la configuración cargada
      this.formConfiguraciones = this.fb.group(form);

      Object.keys(form).forEach(key => {
        if (key.startsWith('enableSync')) {
          const controlName = key.replace(/^enable/, '');
          const targetControl = controlName.charAt(0).toLowerCase() + controlName.slice(1);
          this.toggleField(key, targetControl);
        }
      });

      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error al llenar formulario:', error);
    });
  }
}
