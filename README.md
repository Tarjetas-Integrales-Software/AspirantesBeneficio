# AspirantesBeneficio

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

### Reparar error de actualización en modo desarrollo

Para reparar este error:  
`update-electron-app config looks good; aborting updates since app is in development mode`  
necesitamos borrar los `node_modules` y el `package-lock.json` con el siguiente comando e instalar los módulos nuevamente:

```bash
rm -rf node_modules package-lock.json
npm install
```

Despues tenemos que siguiente comando para recompilar el modulo better-sqlite3
```bash
npx electron-rebuild -f -w better-sqlite3
```
