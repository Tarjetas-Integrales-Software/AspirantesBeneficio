import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-cortes',
  imports: [],
  templateUrl: './cortes.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CortesComponent implements OnInit {

  ngOnInit(): void { }

}
