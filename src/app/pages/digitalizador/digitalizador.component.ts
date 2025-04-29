import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, type OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, startWith, map } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface User {
  name: string;
}

@Component({
  selector: 'app-digitalizador',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatListModule,
    CommonModule
  ],
  templateUrl: './digitalizador.component.html',
  styles: `
    :host {
      display: block;
    }
    .directory-selector-container {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      background-color: #fff;
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }

    .input-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      color: #555;
    }

    .file-input-wrapper {
      display: flex;
      gap: 10px;
    }

    input[type="text"] {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
      cursor: pointer;
    }

    .button {
      padding: 10px 15px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .button:hover {
      background-color: #e0e0e0;
    }

    .button-container {
      display: flex;
      justify-content: center;
      margin-top: 30px;
    }

    .save-button {
      padding: 12px 30px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .save-button:hover {
      background-color: #45a049;
    }

    .save-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalizadorComponent implements OnInit {
  myControl = new FormControl<string | User>('');
  options: User[] = [{ name: 'Manzana' }, { name: 'Uva' }, { name: 'Naranja' }];
  filteredOptions?: Observable<User[]>;
  chart: any;
  showModal = false;

  toggleModal() {
    this.showModal = !this.showModal;
  }

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name as string) : this.options.slice();
      }),
    );
    this.chart = new Chart('myBarChart', this.bar);
  }

  displayFn(user: User): string {
    return user && user.name ? user.name : '';
  }

  private _filter(name: string): User[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  public bar: any = {
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow'],
      datasets: [{
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Chart.js Doughnut Chart'
        }
      }
    },
  };

  // Signals para almacenar las rutas
  sourcePath = signal<string>("")
  destinationPath = signal<string>("")

  // Método para manejar la selección de la ruta de origen
  onSourcePathSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      // Obtenemos la ruta del directorio seleccionado
      // Nota: debido a restricciones de seguridad del navegador, solo obtenemos el nombre
      // del directorio, no la ruta completa del sistema de archivos
      this.sourcePath.set(input.files[0].webkitRelativePath.split("/")[0])
    }
  }

  // Método para manejar la selección de la ruta de destino
  onDestinationPathSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.destinationPath.set(input.files[0].webkitRelativePath.split("/")[0])
    }
  }

  // Método para guardar las rutas
  saveDirectories(): void {
    console.log("Ruta origen:", this.sourcePath())
    console.log("Ruta destino:", this.destinationPath())

    // Aquí puedes implementar la lógica para guardar o procesar las rutas
    // Por ejemplo, enviar a un servicio, almacenar en localStorage, etc.
    alert(`Rutas guardadas:\nOrigen: ${this.sourcePath()}\nDestino: ${this.destinationPath()}`)
  }

  // Método para abrir el selector de archivos programáticamente
  openFileSelector(inputId: string): void {
    document.getElementById(inputId)?.click()
  }
}
