import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../../services/storage.service';
import { MenuService } from '../../../services/CRUD/menu.service';

import { OpcionMenuComponent } from '../opcion-menu/opcion-menu.component';

@Component({
  selector: 'menuComponent',
  imports: [CommonModule, OpcionMenuComponent, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  menuShow: boolean = false;
  opcionesMenu: any[] = [];

  constructor(private router: Router, private storageService: StorageService, private menuService: MenuService) { }

  ngOnInit(): void {
    this.getOpcionesMenu();
  }

  toggleMenu() {
    this.menuShow = !this.menuShow;
  }

  cerrarMenu() {
    this.menuShow = false;
  }

  cerrarSesion(): void {
    this.menuShow = false;

    this.storageService.remove('token');
    this.router.navigate(['/auth/login']);
  }

  permisoOpcionMenu(opciones: any[], opcion: string): boolean {
    const found = opciones.find((opcionMenu) =>
      opcionMenu.clave === opcion
    )

    if (found) return found.valor == "1";

    return false;
  }

  getOpcionesMenu() {
    this.menuService.getOpcionesMenu().subscribe({
      next: response => {
        if (response.response) {
          this.opcionesMenu = response.data
        }
      },
      error: error => {
        console.log(error);
      }
    })
  }
}
