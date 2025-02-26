import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/components/menu/menu.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NetworkStatusComponent } from './components/network-status/network-status.component';
import { NetworkStatusService } from './services/network-status.service';
import { CodigosPostalesService } from './services/CRUD/codigos-postales.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuComponent, FooterComponent, NetworkStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Aspirantes';
  codigos: any[] = []

  constructor(private networkStatusService: NetworkStatusService, private codigosPostalesService: CodigosPostalesService) {

  }

  ngOnInit(): void {
    const online = this.networkStatusService.checkConnection();

    if (online) this.syncDataBase();

    const codigos = this.codigosPostalesService.consultarCodigosPostales();
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
