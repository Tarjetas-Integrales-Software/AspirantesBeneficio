import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { StorageService } from '../../services/storage.service';
import { UsersService } from '../../services/CRUD/users.service';
import { NetworkStatusService } from '../../services/network-status.service';
import Swal from 'sweetalert2';

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
  ) {

      this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]]
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

    if(this.networkStatusService.checkConnection()){

      if (this.loginForm.invalid || this.loading)
        return;

      const { email, password } = this.loginForm.value;

      this.loading = true;
      this.loginService.login({ email: email, password: password }).subscribe(
        (response) => {
          if (response.response) {
            this.storageService.set("token", response.token);
            this.storageService.set("user", response.user);

            this.router.navigate(['/registro']);
          }
          this.loading = false;
        },
        (error) => {
          this.errorMessage = 'Credenciales incorrectas. Por favor, inténtelo de nuevo.';
          this.loading = false;
        }
      );
    }else{
      // aqui entra en caso de no haber conexion para validar el user y password en la db local
      const { email, password } = this.loginForm.value;
      this.usersService.ValidaUsuarioPorEmailyPassEnLocal(email,password)
      .then(existe => {
        if( existe == true){
          this.router.navigate(['/registro']);
        }else{
           Swal.fire('Usuario y/o password incorrectos!','','warning');
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
  }
}
