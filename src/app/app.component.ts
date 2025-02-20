import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'AspirantesBeneficio';

  ngOnInit(): void {
    fetch("https://backtransportistas.tarjetasintegrales.mx:806/api/v1/validatarjeta/listanegrarangofechas", {
      headers: {
        "Content-Type": "application/json",
      }
    }).then(response => response.json()).then(data => alert(data.data)).
    catch(error => alert(error));
  }
}
