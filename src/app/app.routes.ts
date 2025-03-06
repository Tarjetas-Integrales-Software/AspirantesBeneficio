import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./login/login.routes')
  },
  {
    path: 'inicio',
    loadChildren: () => import('./pages/pages.routes').then(m => m.pagesRoutes)
  },
  { path: '**', redirectTo: 'auth', pathMatch: 'full' }
];
