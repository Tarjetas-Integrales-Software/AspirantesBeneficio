import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'menuComponent',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  menuShow = false;

  toggleMenu() {
    this.menuShow = !this.menuShow;
    console.log('toggleMenu');
  }

}
