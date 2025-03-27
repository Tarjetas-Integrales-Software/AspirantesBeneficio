import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('La geolocalización no es soportada por este navegador.');
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject('Error obteniendo la ubicación: ' + error.message);
        },
        {
          enableHighAccuracy: true, // Para obtener mejor precisión
          timeout: 10000, // Tiempo de espera
          maximumAge: 0 // No usar caché
        }
      );
    });
  }

}
