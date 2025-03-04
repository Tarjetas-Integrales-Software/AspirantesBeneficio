import { Component, inject, OnInit } from '@angular/core';

import { NetworkStatusService } from '../../services/network-status.service';

import { MatSnackBarModule, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-network-status',
  imports: [MatSnackBarModule],
  templateUrl: './network-status.component.html',
  styleUrl: './network-status.component.scss'
})
export class NetworkStatusComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  private offlineSnackBarRef: MatSnackBarRef<any> | null = null;

  conexionPerdida = false;

  constructor(private networkStatusService: NetworkStatusService) { }

  openSnackBar(message: string, action: string, duration: number = 5000) {
    return this._snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'start',
      verticalPosition: 'bottom'
    });
  }

  ngOnInit() {
    this.networkStatusService.isOnline.subscribe(status => {
      if (!status) {
        // Si no hay conexión, mostramos un snackbar persistente (sin duración)
        if (!this.offlineSnackBarRef)
          this.offlineSnackBarRef = this._snackBar.open('Sin conexión', 'Cerrar', {
            horizontalPosition: 'start',
            verticalPosition: 'bottom'
          });

        this.conexionPerdida = true;
      } else {
        // Si se restablece la conexión, cerramos el snackbar anterior y mostramos otro
        if (this.offlineSnackBarRef) {
          this.offlineSnackBarRef.dismiss(); // Cierra el anterior si aún está abierto
          this.offlineSnackBarRef = null;
        }

        if (this.conexionPerdida)
          this.openSnackBar('Conexión restaurada', 'OK'); // Mensaje temporal
      }
    });
  }
}
