import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { NetworkStatusService } from '../../services/network-status.service';
import { AspirantesBeneficioService } from '../../services/CRUD/aspirantes-beneficio.service';

export interface AspiranteBeneficio {
  id: string;
  name: string;
  progress: string;
  fruit: string;
}

@Component({
  selector: 'consultaPage',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatIconModule, MatButtonModule],
  templateUrl: './consulta.component.html',
  styleUrl: './consulta.component.scss'
})
export class ConsultaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['curp', 'nombre_completo', 'telefono', 'email', 'fecha_nacimiento', 'estado', 'municipio', 'cp', 'colonia', 'domicilio', 'fecha_evento', 'acciones'];
  dataSource: MatTableDataSource<AspiranteBeneficio>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private networkStatusService: NetworkStatusService, private aspirantesBeneficioService: AspirantesBeneficioService) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    this.getAspirantesBeneficio();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getAspirantesBeneficio(): void {
    this.aspirantesBeneficioService.consultarAspirantes()
      .then((aspirantesBeneficio) => {
        this.dataSource.data = aspirantesBeneficio;
      })
      .catch((error) => console.error('Error al obtener aspirantes a beneficio:', error));
  }
}
