import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-digitalizador',
  imports: [],
  templateUrl: './digitalizador.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalizadorComponent implements OnInit {

  ngOnInit(): void { }

}
