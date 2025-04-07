import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-opcion-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './opcion-menu.component.html',
  styleUrl: './opcion-menu.component.scss'
})
export class OpcionMenuComponent {
  @Input() icono: string = '';
  @Input() texto: string = '';
  @Input() ruta: string = '';
  @Input() esCerrarSesion: boolean = false;
  @Input() accion?: () => void;

  constructor(private sanitizer: DomSanitizer) { }

  get iconoSafe(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="32" 
        height="32" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline"
      >
        ${this.icono}
      </svg>
    `);
  }
}
