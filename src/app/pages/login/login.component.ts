import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { StorageService } from '../../services/storage.service';
import { UsersService } from '../../services/CRUD/users.service';

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
    , private usersService: UsersService) {

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
  }

  syncDataBase(): void {
    this.usersService.getUsers().subscribe({
      next: ((response) => {
        console.log(response.data.usuarios_aspben);
        this.usersService.syncLocalDataBase(response.data.usuarios_aspben)
      }
      ),
      error: ((error) => { })
    });
  }
}
