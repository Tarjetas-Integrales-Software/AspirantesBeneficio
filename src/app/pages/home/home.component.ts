import { Component, ViewChild } from '@angular/core';
import { DatosGeneralesComponent } from './components/datos-generales/datos-generales.component';
import { FotoComponent } from './components/foto/foto.component';

@Component({
  selector: 'app-home',
  imports: [DatosGeneralesComponent, FotoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  @ViewChild('datosForm') datosForm!: DatosGeneralesComponent;

  submitDatosForm() {
    this.datosForm.onSave();
  }
}
