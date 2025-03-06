import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { StorageService } from '../../../services/storage.service';


@Component({
  selector: 'menuComponent',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  menuShow: boolean = false;

  constructor(private router: Router, private storageService: StorageService) {}

  toggleMenu() {
    this.menuShow = !this.menuShow;
  }

  cerrarSesion(): void {
    this.menuShow = false;

    this.storageService.remove('token');
    this.router.navigate(['/auth/login']);
  }
}
