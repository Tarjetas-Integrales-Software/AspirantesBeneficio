import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../../services/storage.service';
import { MenuService } from '../../../services/CRUD/menu.service';
import { RelacionUsuarioRolesService } from '../../../services/CRUD/relacion-usuario-roles.service';

import { OpcionMenuComponent } from '../opcion-menu/opcion-menu.component';

import { NetworkStatusService } from '../../../services/network-status.service';

@Component({
  selector: 'menuComponent',
  imports: [CommonModule, OpcionMenuComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  @ViewChild('menuRef') menuRef?: ElementRef<HTMLDivElement>;
  @ViewChild('toggleBtnRef') toggleBtnRef?: ElementRef<HTMLButtonElement>;


  menuShow: boolean = false;
  idUserSesion: number = 0;

  opcionesMenu: any[] = [];
  rolesUsuario: Array<{ fkRole: number }> = [];

  rolesConPermisoMenu_Asistencia: number[] = [106];
  rolesConPermisoMenu_Registro: number[] = [108];
  rolesConPermisoMenu_Consulta: number[] = [109];
  rolesConPermisoMenu_Reportes: number[] = [110];
  rolesConPermisoMenu_Impresion: number[] = [111];
  rolesConPermisoMenu_ImpresionManual: number[] = [112];
  rolesConPermisoMenu_Digitalizador: number[] = [113];
  rolesConPermisoMenu_AprobadasSSAS: number[] = [120];
  rolesConPermisoMenu_Settings: number[] = [121];
  rolesConPermisoMenu_ConsultaSSAS: number[] = [122];

  constructor(private router: Router, private storageService: StorageService, private menuService: MenuService, private relacionUsuarioRolesService: RelacionUsuarioRolesService,
    private networkStatusService: NetworkStatusService
  ) {
    if (this.storageService.exists('user')) {
      const user = this.storageService.get('user');
      const { iduser } = user;

      this.idUserSesion = iduser;
    }
  }

  ngOnInit(): void {
    this.getOpcionesMenu();
    this.getRolesUsuario(this.idUserSesion);
  }

  toggleMenu() {
    this.menuShow = !this.menuShow;
  }

  cerrarMenu() {
    this.menuShow = false;
  }

  // Cierra el menú si se hace click fuera del contenedor del menú y del botón toggle
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuShow) return;
    const target = event.target as Node;
    const menuEl = this.menuRef?.nativeElement;
    const toggleBtnEl = this.toggleBtnRef?.nativeElement;

    if (menuEl && menuEl.contains(target)) return;
    if (toggleBtnEl && toggleBtnEl.contains(target)) return;

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

    if (found) return found.valor == 1;

    return false;
  }

  getOpcionesMenu() {
    this.menuService.getOpcionesMenuLocal().then((opcionesMenu) => {
      if (opcionesMenu) this.opcionesMenu = opcionesMenu;
    });
  }

  getRolesUsuario(idUser: number) {
    if (this.networkStatusService.checkConnection()) {
      this.relacionUsuarioRolesService.getRelaciones().subscribe({
        next: (response) => {
          if (response.response) this.relacionUsuarioRolesService.syncLocalDataBase(response.data).then(() => {
            this.relacionUsuarioRolesService.consultarRolesPorUsuario(idUser).then((roles) => {
              this.rolesUsuario = roles;
            });
          })
        },
        error: (error) => {
          console.log(error);

        }
      })
    }
    else
      this.relacionUsuarioRolesService.consultarRolesPorUsuario(idUser).then((roles) => {
        this.rolesUsuario = roles
      });
  }

  get permisoMenu_Registro(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Registro.includes(Number(perfil.fkRole))); }
  get permisoMenu_Settings(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Settings.includes(Number(perfil.fkRole))); }
  get permisoMenu_Consulta(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Consulta.includes(Number(perfil.fkRole))); }
  get permisoMenu_ConsultaSSAS(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_ConsultaSSAS.includes(Number(perfil.fkRole))); }
  get permisoMenu_Aprobadas(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_AprobadasSSAS.includes(Number(perfil.fkRole))); }
  get permisoMenu_Reportes(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Reportes.includes(Number(perfil.fkRole))); }
  get permisoMenu_Asistencia(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Asistencia.includes(Number(perfil.fkRole))); }
  get permisoMenu_Impresion(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Impresion.includes(Number(perfil.fkRole))); }
  get permisoMenu_ImpresionManual(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_ImpresionManual.includes(Number(perfil.fkRole))); }
  get permisoMenu_Digitalizador(): boolean { return this.rolesUsuario.some((perfil) => perfil.fkRole && this.rolesConPermisoMenu_Digitalizador.includes(Number(perfil.fkRole))); }
}
