import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { StorageService } from '../services/storage.service';
import { UsersService } from '../services/CRUD/users.service';
import { NetworkStatusService } from '../services/network-status.service';
import Swal from 'sweetalert2';
import { GradosService } from '../services/CRUD/grados.service';
import { CarrerasService } from '../services/CRUD/carreras.service';
import { TiposCarrerasService } from '../services/CRUD/tipos-carreras.service';
import { ModulosService } from '../services/CRUD/modulos.service';
import { MenuService } from '../services/CRUD/menu.service';

declare const window: any;

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  token: string = '';
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  loading: boolean = false;
  configuraciones: any[] = [];

  constructor(private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
    private storageService: StorageService,
    private usersService: UsersService,
    private networkStatusService: NetworkStatusService,
    private gradosService: GradosService,
    private tiposCarrerasService: TiposCarrerasService,
    private carrerasService: CarrerasService,
    private modulosService: ModulosService,
    private menuService: MenuService,
  ) {

    this.loginForm = this.fb.group({
      email: ['aspben_nestor_davalos', [Validators.required]],
      password: ['1234K', [Validators.required, Validators.minLength(5)]]
    });
  }

  permisoOpcionMenu(opciones: any[], opcion: string): boolean {
    const found = opciones.find((opcionMenu) =>
      opcionMenu.clave === opcion
    )

    if (found) return found.valor == "1";

    return false;
  }

  async ngOnInit(): Promise<void> {
    if (this.networkStatusService.checkConnection()) this.syncDataBase();

    if (this.storageService.exists("token"))
      this.token = this.storageService.get("token");

    if (this.token !== "") this.router.navigate(['/registro']);

    this.loginService.configuraciones$.subscribe(data => {
      this.configuraciones = data;
    });


  }

  getConfigPorIdentificador(identificador: string): any | null {
    if (!this.configuraciones) return null;
    const configItem = this.configuraciones.find((item: any) => item.nombre_identificador === identificador);
    return configItem || null;
  }

  login(): void {

    if (this.networkStatusService.checkConnection()) {

      if (this.loginForm.invalid || this.loading)
        return;

      const { email, password } = this.loginForm.value;

      this.loading = true;
      this.loginService.login({ email: email.trim(), password: password.trim() }).subscribe(
        (response) => {
          if (response.response) {
            this.storageService.set("token", response.token);
            this.storageService.set("user", response.user);
            this.storageService.set("perfiles", response.perfiles);

            this.menuService.getOpcionesMenu().subscribe({
              next: ((response) => {
                if (response.response) {
                  this.menuService.syncMenuOptionsLocal(response.data);

                  this.menuService.getOpcionesMenuLocal().then((opcionesMenu) => {
                    if (opcionesMenu) {
                      // Crear un mapa para acceder fácilmente a las opciones por su clave
                      const menuOptions: { [key: string]: string } = {};

                      // Mapear todas las opciones de menú
                      opcionesMenu.forEach((option: any) => {
                        menuOptions[option.clave] = option.valor;
                      });

                      // Navegación basada en permisos
                      if (menuOptions['menu_habilitar_configurar'] === '1') {
                        this.router.navigate(['/inicio/modulo-operaciones']);
                      } else if (menuOptions['menu_habilitar_consulta'] === '1') {
                        this.router.navigate(['/inicio/consulta']);
                      } else if (menuOptions['menu_habilitar_impresion'] === '1') {
                        this.router.navigate(['/inicio/impresion-credencial']);
                      } else if (menuOptions['menu_habilitar_reportes'] === '1') {
                        this.router.navigate(['/inicio/reportes']);
                      } else if (menuOptions['menu_habilitar_asistencia'] === '1') {
                        this.router.navigate(['/inicio/asistencia']);
                      } else {
                        // Si no tiene ningún permiso, mostrar un mensaje
                        Swal.fire('Sin acceso', 'No tienes acceso a ningún módulo del sistema - online -', 'warning');
                      }
                    } else {
                      this.loading = false;
                      Swal.fire('Error', 'No se pudieron cargar las opciones del menú', 'error');
                    }
                  }
                  );
                }
              }),
              error: ((error) => {
                console.error('Error al sincronizar opciones de menú:', error);
              })
            });
          } else {
            Swal.fire(response.message, '', 'warning');
            this.loading = false;
          }
        },
        (error) => {
          this.errorMessage = 'Credenciales incorrectas. Por favor, inténtelo de nuevo.';
          this.loading = false;
        }
      );
    } else {
      // aqui entra en caso de no haber conexion para validar el user y password en la db local

      const { email, password } = this.loginForm.value;
      this.usersService.ValidaUsuarioPorEmailyPassEnLocal(email, password)
        .then(existe => {
          if (existe == true) {
            // Obtener opciones de menú de la base de datos local
            this.menuService.getOpcionesMenuLocal().then(menuOptions => {

              // CODIGO DAVID INICIO

              // Definir un tipo para las opciones del menú para mayor seguridad en tipos
              interface MenuOption {
                clave: string;
                valor: string;
              }

              // Crear un mapa de rutas basado en las claves del menú
              const routeMap: { [key: string]: string } = {
                menu_habilitar_configurar: '/inicio/modulo-operaciones',
                menu_habilitar_consulta: '/inicio/consulta',
                menu_habilitar_impresion: '/inicio/impresion-credencial',
                menu_habilitar_reportes: '/inicio/reportes',
                menu_habilitar_asistencia: '/inicio/asistencia'
              };

              // Convertir el array de opciones a un objeto mapa de forma más funcional
              const menuMap = menuOptions.reduce((acc: { [key: string]: string }, option: MenuOption) => {
                acc[option.clave] = option.valor;
                return acc;
              }, {});

              // Encontrar la primera ruta habilitada
              const enabledRoute = Object.keys(routeMap).find(key => menuMap[key] == 1);

              if (enabledRoute) {
                this.router.navigate([routeMap[enabledRoute]]);
              } else {
                // Si no tiene ningún permiso, mostrar un mensaje
                Swal.fire({
                  title: 'Sin acceso',
                  text: 'No tienes acceso a ningún módulo del sistema - offline -',
                  icon: 'warning'
                });
              }


              // CODIGO DAVID FIN

            }).catch(err => {
              console.error('Error al obtener opciones de menú locales:', err);
              // Fallback a configuraciones en caso de error
              this.router.navigate(['/inicio/modulo-operaciones']);
            });
          } else {
            Swal.fire('Usuario y/o password incorrectos!', '', 'warning');
          }
        })

    }



  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  syncDataBase(): void {
    this.usersService.getUsers().subscribe({
      next: ((response) => {
        this.usersService.syncLocalDataBase(response.data.usuarios_aspben)
      }
      ),
      error: ((error) => { })
    });

    this.gradosService.getGrados().subscribe({
      next: ((response) => {
        this.gradosService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });

    this.tiposCarrerasService.getTiposCarreras().subscribe({
      next: ((response) => {
        this.tiposCarrerasService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });

    this.carrerasService.getCarreras().subscribe({
      next: ((response) => {
        this.carrerasService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });

    this.modulosService.getModulos().subscribe({
      next: ((response) => {
        this.modulosService.syncLocalDataBase(response.data)
      }
      ),
      error: ((error) => { })
    });
  }
}
