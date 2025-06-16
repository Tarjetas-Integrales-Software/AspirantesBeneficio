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
  { path: '**', redirectTo: '/auth/login', pathMatch: 'full' }
  //{ path: '**', redirectTo: '/inicio/digitalizador', pathMatch: 'full' }
];
