import { Component, inject, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Jalisco } from '../../../../../../public/assets/data/jalisco.interface';
import { HomeService } from '../../home.service';
import { CodigosPostalesService } from '../../../../services/CRUD/codigos-postales.service';
import { NetworkStatusService } from '../../../../services/network-status.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ModalidadesService } from '../../../../services/CRUD/modalidades.service';
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

@Component({
  selector: 'datosGeneralesComponent',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInput,
    MatDatepickerModule,
  ],
  templateUrl: './datos-generales.component.html',
  styleUrl: './datos-generales.component.scss'
})
export class DatosGeneralesComponent implements OnInit {

  private fb = inject(FormBuilder);
  estados: string[] = [];
  ciudades: string[] = [];
  tiposAsentamiento: string[] = [];
  tiposZona: string[] = [];
  colonias: any[] = [];
  modalidades: any[] = [];

  tipoAsentamiento: string = '';
  tipoZona: string = '';

  constructor(private homeService: HomeService, private networkStatusService: NetworkStatusService, private codigosPostalesService: CodigosPostalesService, private modalidadesService: ModalidadesService) { }

  myForm: FormGroup = this.fb.group({
    curp: ['', [Validators.required, Validators.minLength(18)],],
    modalidad: ['', [Validators.required, Validators.minLength(5)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(1)]],
    telefono: ['', [Validators.minLength(10)]],
    fecha_nacimiento: ['', [Validators.required, Validators.minLength(10)]],
    email: ['', [Validators.required, Validators.email]],
    estado: ['Jalisco', [Validators.required, Validators.minLength(5)]],
    municipio: ['', [Validators.required, Validators.minLength(5)]],
    codigoPostal: ['', [Validators.required, Validators.minLength(5)]],
    Colonia: ['', [Validators.required, Validators.minLength(5)]],
    tipoZona: ['', [Validators.required, Validators.minLength(5)]],
    tipoAsentamiento: ['', [Validators.required, Validators.minLength(5)]],
    domicilio: ['', [Validators.required, Validators.minLength(5)]],
    cometarios: [''],
  })


  loadJaliscoData(): void {
    this.homeService.getJaliscoData().subscribe((data: Jalisco) => {
      this.estados = data.data.map(item => item.estado);
      this.municipios = data.data.map(item => item.municipio);
      this.ciudades = data.data.map(item => item.ciudad);
      this.tiposAsentamiento = data.data.map(item => item.tipo_asentamiento);
      this.tiposZona = data.data.map(item => item.tipo_zona);
      this.colonias = data.data.map(item => item.colonia);
    });
  }

  onCurpChange(): void {
    const curp = this.myForm.controls['curp'].value;

    this.homeService.getJaliscoByCP(curp).subscribe((data: Jalisco) => {
      console.log(data);
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

  codigosPostales: any[] = [];
  municipios: any[] = [];
  municipio: string = '';

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) this.syncDataBase();

    this.getCodigosPostales({});
    this.getMunicipios();
    this.getModalidades();

    // Llama al método para inhabilitar los inputs
    this.disableInputs();
  }

  disableInputs(): void {
    this.myForm.get('tipoZona')?.disable();
    this.myForm.get('tipoAsentamiento')?.disable();
  }

  getMunicipios(): void {
    this.codigosPostalesService.consultarMunicipios()
      .then((municipios) => {
        this.municipios = municipios;
      })
      .catch((error) => console.error('Error al obtener municipios:', error));
  }

  getCodigosPostales(params: { cp?: string, colonia?: string, municipio?: string }): void {
    const { cp, colonia, municipio } = params;

    this.codigosPostalesService.consultarCodigosPostales({ cp: cp, colonia: colonia, municipio: municipio })
      .then((resultados) => {
        this.codigosPostales = resultados;
      })
      .catch((error) => console.error('Error al consultar códigos postales:', error));
  }

  getColoniasByCP(): void {
    const cp = this.myForm.get('codigoPostal')?.value;

    this.codigosPostalesService.consultarColonias(cp)
      .then((colonias) => {
        this.colonias = colonias;
      })
      .catch((error) => console.error('Error al obtener colonias:', error));
  }

  getModalidades(): void {
    this.modalidadesService.consultarModalidades()
      .then(modalidades => {
        this.modalidades = modalidades;
      })
      .catch(error => console.error('Error al obtener modalidades:', error));
  }

  onColoniaChange(colonia: string): void {
    const selectedColonia = this.colonias.find(item => item.colonia === colonia);
    if (selectedColonia) {
      this.tipoAsentamiento = selectedColonia.tipo_asentamiento;
      this.tipoZona = selectedColonia.tipo_zona;
    }
  }

  syncDataBase(): void {
    this.codigosPostalesService.getCodigosPostales().subscribe({
      next: ((response) => {
        this.codigosPostalesService.syncLocalDataBase(response.data)
      }),
      error: ((error) => { })
    });
    this.modalidadesService.getModalidades().subscribe({
      next: ((response) => {
        this.modalidadesService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });

  }

  onSafe() {
    this.myForm.markAllAsTouched();
  }

  toUpperCaseCurp(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.myForm.get('curp')?.setValue(input.value);
  }
  toUpperCaseName(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.myForm.get('nombreCompleto')?.setValue(input.value);
  }

  capitalizeWords(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.toTitleCase(input.value);
    this.myForm.get('nombreCompleto')?.setValue(input.value);
  }

  toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
}
