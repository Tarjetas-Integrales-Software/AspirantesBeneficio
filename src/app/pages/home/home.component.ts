import { Component, OnInit, ViewChild } from '@angular/core';
import { DatosGeneralesComponent } from './components/datos-generales/datos-generales.component';
import { FotoComponent } from './components/foto/foto.component';
import { CurpsRegistradasService } from '../../services/CRUD/curps-registradas.service';
import { OpcionesGeneralesService } from '../../services/CRUD/opciones-generales.service';

@Component({
  selector: 'app-home',
  imports: [DatosGeneralesComponent, FotoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  @ViewChild('datosForm') datosForm!: DatosGeneralesComponent;

constructor(private curpsRegistradasService: CurpsRegistradasService
        , private opcionesGeneralesService: OpcionesGeneralesService
) { }

  ngOnInit(): void {
    this.syncDataBase();
  }

  syncDataBase(): void {
    this.curpsRegistradasService.getCurpsRegistradas().subscribe({
      next: ((response) => {
        this.curpsRegistradasService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });
    this.opcionesGeneralesService.getOpcionesGenerales().subscribe({
      next: ((response) => {
        this.opcionesGeneralesService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });
  }

  submitDatosForm() {
    this.datosForm.onSafe();
  }
}
