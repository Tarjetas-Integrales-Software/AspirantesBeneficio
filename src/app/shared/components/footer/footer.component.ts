import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import { environment } from '../../../../environments/environment';
import { AspirantesBeneficioFotosService } from '../../../services/CRUD/aspirantes-beneficio-fotos.service';

@Component({
  selector: 'footerComponent',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  user: string = '';
  private intervalId: any;
  version: string = environment.gitversion;

  constructor(private storageService: StorageService
    ,private aspirantesBeneficioFotosService: AspirantesBeneficioFotosService
  ) { }

  ngOnInit(): void {
    this.actualizarUsuario();

    this.intervalId = setInterval(() => {
      this.actualizarUsuario();
    }, 5000);
  }

  actualizarUsuario(): void {
    if (this.storageService.exists("user")) {
      const user = this.storageService.get("user");
      this.user = user.email;
    }
  }



  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
