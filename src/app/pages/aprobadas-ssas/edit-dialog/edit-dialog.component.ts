import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { CurpAprobadaSsas } from './../aprobadas-ssas.component';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatSelectModule, MatButtonModule]
})
export class EditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row: CurpAprobadaSsas; modulos: string[]; modalidades: string[] }
  ) {
    this.form = this.fb.group({
      id: [data.row.id],
      curp: [data.row.curp],
      nombre: [data.row.nombre],
      apellido_paterno: [data.row.apellido_paterno],
      apellido_materno: [data.row.apellido_materno],
      modulo: [data.row.modulo],
      telefono: [data.row.telefono],
      celular: [data.row.celular],
      modalidad: [data.row.modalidad],
      fpu: [data.row.fpu]
    });
  }

  save() {
    this.dialogRef.close(this.form.value);
  }

  cancel() {
    this.dialogRef.close();
  }
}
