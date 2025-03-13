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

  loading: boolean = false;

  constructor(private fb: FormBuilder
    , private router: Router
    , private loginService: LoginService
    , private storageService: StorageService
    , private usersService: UsersService
    , private networkStatusService: NetworkStatusService
    , private gradosService: GradosService
    , private tiposCarrerasService: TiposCarrerasService
    , private carrerasService: CarrerasService
    , private modulosService: ModulosService
  ) {

    this.loginForm = this.fb.group({
      email: ['aspben_nestor_davalos', [Validators.required]],
      password: ['1234K', [Validators.required, Validators.minLength(5)]]
    });
  }

  async ngOnInit(): Promise<void> {

    //Sincronizar Usuarios de TISA hacia la DB Local
    this.syncDataBase();

    if (this.storageService.exists("token"))
      this.token = this.storageService.get("token");

    if (this.token !== "") this.router.navigate(['/registro']);
  }

  login(): void {

    if (this.networkStatusService.checkConnection()) {

      if (this.loginForm.invalid || this.loading)
        return;

      const { email, password } = this.loginForm.value;

      this.loading = true;
      this.loginService.login({ email: email, password: password }).subscribe(
        (response) => {
          if (response.response) {
            this.storageService.set("token", response.token);
            this.storageService.set("user", response.user);
            this.storageService.set("perfiles", response.perfiles);

            this.router.navigate(['/inicio/registro']);
          }
          this.loading = false;
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
            this.router.navigate(['/inicio/registro']);
          } else {
            Swal.fire('Usuario y/o password incorrectos!', '', 'warning');
          }
        })

    }



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
