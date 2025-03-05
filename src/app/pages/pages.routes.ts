import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { ConsultaComponent } from "./consulta/consulta.component";
import { PagesComponent } from "./pages.component";

export const pagesRoutes: Routes = [
    {
        path: '',
        component: PagesComponent,
        children: [
            {
                path: 'registro',
                title: 'Registro',
                component: HomeComponent
            },
            {
                path: 'consulta',
                title: 'Consulta',
                component: ConsultaComponent
            },
            {
                path: '**',
                redirectTo: 'registro'
            }
        ]
    }
]