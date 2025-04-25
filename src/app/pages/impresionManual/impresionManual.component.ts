import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FotoComponent } from '../home/components/foto/foto.component';

@Component({
  selector: 'app-impresion-manual',
  imports: [FotoComponent],
  templateUrl: './impresionManual.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpresionManualComponent { }
