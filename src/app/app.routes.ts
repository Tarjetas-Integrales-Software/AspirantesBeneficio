import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ConsultaComponent } from './pages/consulta/consulta.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: HomeComponent },
  { path: 'consulta', component: ConsultaComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
