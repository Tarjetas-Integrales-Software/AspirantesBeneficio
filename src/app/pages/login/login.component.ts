import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { StorageService } from '../../services/storage.service';

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

  constructor(private fb: FormBuilder, private router: Router, private loginService: LoginService, private storageService: StorageService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  async ngOnInit(): Promise<void> {
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
}
