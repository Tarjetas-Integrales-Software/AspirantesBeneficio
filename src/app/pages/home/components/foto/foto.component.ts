import { Component } from '@angular/core';

@Component({
  selector: 'fotoComponent',
  imports: [],
  templateUrl: './foto.component.html',
  styleUrl: './foto.component.scss'
})
export class FotoComponent {

  capturePhoto() {
    console.log('Photo captured');
  }

  register() {
    console.log('Registering');
  }
}
