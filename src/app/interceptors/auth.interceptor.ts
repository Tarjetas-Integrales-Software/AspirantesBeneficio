import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);

  // Verificamos si el token existe antes de intentar obtenerlo
  if (storageService.exists('token')) {
    const token = storageService.get('token');

    if (token) {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedReq);
    }
  }

  // Si no hay token, continuamos con la solicitud original
  return next(req);
};