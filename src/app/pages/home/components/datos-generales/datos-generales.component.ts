import { Component, inject, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { Jalisco } from '../../../../../../public/assets/data/jalisco.interface';
import { HomeService } from '../../home.service';
import { HttpClientModule } from '@angular/common/http';

interface Food {
  value: string;
  viewValue: string;
}


@Component({
  selector: 'datosGeneralesComponent',
  imports: [MatDividerModule, MatInputModule, MatFormFieldModule, MatSelectModule, CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, HttpClientModule],
  templateUrl: './datos-generales.component.html',
  styleUrl: './datos-generales.component.scss'
})
export class DatosGeneralesComponent implements OnInit {

  private fb = inject(FormBuilder);
  estados: Jalisco['data'] = [];

  constructor(private homeService: HomeService) { }

  myForm: FormGroup = this.fb.group({
    curp: ['', [Validators.required, Validators.minLength(18)],],
    modalidad: ['', [Validators.required, Validators.minLength(5)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(1)]],
    telefono: ['', [Validators.minLength(10)]],
    email: ['', [Validators.required, Validators.email]],
    estado: ['Jalisco', [Validators.required, Validators.minLength(5)]],
    municipio: ['', [Validators.required, Validators.minLength(5)]],
    codigoPostal: [0, [Validators.required, Validators.minLength(5)]],
    Colonia: ['', [Validators.required, Validators.minLength(5)]],
    tipoZona: ['', [Validators.required, Validators.minLength(5)]],
    tipoAsentamiento: ['', [Validators.required, Validators.minLength(5)]],
    domicilio: ['', [Validators.required, Validators.minLength(5)]],
  })

  ngOnInit(): void {
    this.loadJaliscoData();
  }

  loadJaliscoData(): void {
    this.homeService.getJaliscoData().subscribe((data: Jalisco) => {
      this.estados = data.data;
    });
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
      }
    }
    return null;
  }

  selectedValue: string = '';
  selectedCar: string = '';

  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' },
  ];


  onSave() {
    this.myForm.markAllAsTouched();
    // Lógica para enviar el formulario
    console.log("Formulario enviado");
  }

}
