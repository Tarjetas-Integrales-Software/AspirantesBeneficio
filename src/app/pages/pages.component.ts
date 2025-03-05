import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "../shared/components/footer/footer.component";
import { NetworkStatusComponent } from "../components/network-status/network-status.component";
import { MenuComponent } from "../shared/components/menu/menu.component";

@Component({
  selector: 'app-pages',
  imports: [RouterOutlet, FooterComponent, NetworkStatusComponent, MenuComponent],
  templateUrl: './pages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesComponent { }
