import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-impresion-manual',
  imports: [],
  templateUrl: './impresionManual.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpresionManualComponent { }
