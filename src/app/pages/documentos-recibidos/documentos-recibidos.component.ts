import { Component, OnInit, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
} from '@angular/forms';

import { AtencionSinCitaService } from '../../services/CRUD/atencion-sin-cita.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-documentos-recibidos',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSelectModule,
    MatCardModule,
    MatListModule,
  ],
  templateUrl: './documentos-recibidos.component.html',
  styleUrl: './documentos-recibidos.component.scss'
})
export class DocumentosRecibidosComponent implements OnInit {
  private fb = inject(FormBuilder);

  atenciones: any[] = [];

  formCaratula: FormGroup;

  constructor(private atencionSinCitaService: AtencionSinCitaService) {
    this.formCaratula = this.fb.nonNullable.group({
      fecha: new Date(),
      id_modulo: '',
    });

    this.formCaratula.get('id_modulo')?.valueChanges.subscribe(idModulo => {
      if (idModulo) {
        const fecha = this.formCaratula.get('fecha')?.value;

        this.getAtencionSinCita({ id_modulo: idModulo, fecha: fecha?.toISOString().substring(0, 10) });
      }
    });

    this.formCaratula.get('fecha')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const idModulo = this.formCaratula.get('id_modulo')?.value;

        this.getAtencionSinCita({ fecha: fecha?.toISOString().substring(0, 10), id_modulo: idModulo });
      }
    });
  }

  ngOnInit(): void {
    const idModulo = this.formCaratula.get('id_modulo')?.value;
    const fecha = this.formCaratula.get('fecha')?.value.toISOString().split('T')[0];

    if (idModulo == "") return;
    if (fecha == "") return;

    const body = {
      fecha,
      id_modulo: idModulo
    };

    this.getAtencionSinCita(body);
  }


  getAtencionSinCita(body: Object): void {
    this.atencionSinCitaService.getCaratula(body).subscribe({
      next: (response) => {
        if (!response) return;

        if (response.response) this.atenciones = response.data;
      },
      error: (error) => {
        console.log('Error:', error);
      },
    }
    )
  }
}
