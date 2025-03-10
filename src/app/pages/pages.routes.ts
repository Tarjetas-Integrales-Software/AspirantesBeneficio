import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { ConsultaComponent } from "./consulta/consulta.component";
import { PagesComponent } from "./pages.component";
import { ReportesComponent } from "./reportes/reportes.component";
import { ConfiguracionesComponent } from "./configuraciones/configuraciones.component";
import { ChecadorAsistenciaComponent } from "./checador-asistencia/checador-asistencia.component";

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
                path: 'editar/:id',
                title: 'Editar',
                component: HomeComponent
            },
            {
              path: 'reportes',
              title: 'Reportes',
              component: ReportesComponent
            },
            {
              path: 'configuraciones',
              title: 'Configuraciones',
              component: ConfiguracionesComponent
            },
            {
              path: 'checador-asistencia',
              title: 'Checador Asistencia',
              component: ChecadorAsistenciaComponent
            },
            {
                path: '**',
                redirectTo: 'registro'
            }
        ]
    }
]
