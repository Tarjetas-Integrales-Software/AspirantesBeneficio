import { Component, OnInit, ViewChild, ElementRef, inject, Output, EventEmitter } from "@angular/core"
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from "@angular/common"
import { Validators,FormsModule,ReactiveFormsModule,FormGroup,FormBuilder, } from "@angular/forms"
import { get } from "http";
import { ConfiguracionesService } from "../../services/CRUD/configuraciones.service";
import { ModulosService } from "../../services/CRUD/modulos.service";
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
        MatIconModule,
        MatDatepickerModule,
        MatCardModule,
  ],
  templateUrl: './configuraciones.component.html',
  styleUrl: './configuraciones.component.scss'
})
export class ConfiguracionesComponent implements OnInit
{
  @Output() submitForm = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  modulos: any[] = [];
  selectedValue_modu: string = '';

  constructor(private modulosService: ModulosService
    , private configuracionesService: ConfiguracionesService
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

  selectedValue_modulo(){
    console.log('selectedValue_modu', this.selectedValue_modu);
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

  async onSubmit(): Promise<void> {
    console.log('submitForm', this.myForm.value);
    try {
      this.selectedValue_modu = this.myForm.get('modulo')?.value;
      await this.configuracionesService.insertOrUpdateConfiguracion('modulo', this.selectedValue_modu);
      Swal.fire({
        title: 'Actualizacion exitosa!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
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
