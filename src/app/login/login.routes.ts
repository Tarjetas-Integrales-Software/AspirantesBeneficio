import { Routes } from "@angular/router";
import { LoginComponent } from "./login.component";

export const loginRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: '**',
                redirectTo: 'login'
            }
        ]
    }
]

export default loginRoutes;