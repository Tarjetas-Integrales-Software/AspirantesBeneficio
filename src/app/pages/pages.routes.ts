import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { ConsultaComponent } from "./consulta/consulta.component";
import { PagesComponent } from "./pages.component";
import { ReportesComponent } from "./reportes/reportes.component";
import { ModuloOperacionesComponent } from "./modulo-operaciones/modulo-operaciones.component";
import { AsistenciaComponent } from "./asistencia/asistencia.component";
import { ImpresionCredencialComponent } from "./impresion-credencial/impresion-credencial.component";
import { AccionesComponent } from "./acciones/acciones.component";
import { ImpresionManualComponent } from "./impresionManual/impresionManual.component";
import { DigitalizadorComponent } from "./digitalizador/digitalizador.component";
import { CortesComponent } from "./cortes/cortes.component";
import { ConfiguracionesComponent } from "./configuraciones/configuraciones.component";
import { AprobadasSsasComponent } from "./aprobadas-ssas/aprobadas-ssas.component";
import { ConsultaSsasComponent } from "./consulta-ssas/consulta-ssas.component";
import { DocumentosRecibidosComponent } from "./documentos-recibidos/documentos-recibidos.component";

export const pagesRoutes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'modulo-operaciones',
        title: 'Módulo operaciones',
        component: ModuloOperacionesComponent
      },
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
        path: 'consulta-ssas',
        title: 'Consulta SSAS',
        component: ConsultaSsasComponent
      },
      {
        path: 'editar/:id',
        title: 'Editar',
        component: HomeComponent
      },
      {
        path: 'aprobadas-ssas',
        title: 'Aprobadas SSAS',
        component: AprobadasSsasComponent
      },
      {
        path: 'reportes',
        title: 'Reportes',
        component: ReportesComponent
      },
      {
        path: 'asistencia',
        title: 'Asistencia',
        component: AsistenciaComponent
      },
      {
        path: 'acciones',
        title: 'Acciones',
        component: AccionesComponent
      },
      {
        path: 'impresion-credencial',
        title: 'Impresion Credencial',
        component: ImpresionCredencialComponent
      },
      {
        path: 'impresion-manuales',
        title: 'Impresion Credencial Manuales',
        component: ImpresionManualComponent
      },
      {
        path: 'digitalizador',
        title: 'Digitalizador',
        component: DigitalizadorComponent
      },
      {
        path: 'cortes',
        title: 'Cortes',
        component: CortesComponent
      },
      {
        path: 'configuraciones',
        title: 'Configuraciones',
        component: ConfiguracionesComponent
      },
      {
        path: 'archivos-recibidos',
        title: 'Archivos recibidos',
        component: DocumentosRecibidosComponent
      },
      {
        path: '**',
        redirectTo: 'registro'
      }
    ]
  }
]
