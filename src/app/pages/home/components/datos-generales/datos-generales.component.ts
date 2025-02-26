import { Component, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { NetworkStatusService } from './../../../../services/network-status.service';
import { CodigosPostalesService } from './../../../../services/CRUD/codigos-postales.service';

interface Food {
  value: string;
  viewValue: string;
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'datosGeneralesComponent',
  imports: [MatDividerModule, MatInputModule, MatFormFieldModule, MatSelectModule, CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './datos-generales.component.html',
  styleUrl: './datos-generales.component.scss'
})
export class DatosGeneralesComponent implements OnInit {
  municipio: string = '';
  selectedValue: string = '';
  selectedCar: string = '';

  codigosPostales: any[] = [];
  municipios: any[] = [];

  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' },
  ];

  emailFormControl = new FormControl('', [Validators.required, Validators.email]);

  matcher = new MyErrorStateMatcher();

  constructor(private networkStatusService: NetworkStatusService, private codigosPostalesService: CodigosPostalesService) { }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) this.syncDataBase();

    this.getCodigosPostales({});
    this.getMunicipios();
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

  syncDataBase(): void {
    this.codigosPostalesService.getCodigosPostales().subscribe({
      next: ((response) => {
        this.codigosPostalesService.syncLocalDataBase(response.data)
      }),
      error: ((error) => { })
    });
  }
}
