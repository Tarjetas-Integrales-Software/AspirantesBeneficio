# AspirantesBeneficio

## Development server

To start a local development server, run:

```bash
ng serve
```

---

### Reparar error de actualización en modo desarrollo

Para solucionar el siguiente error:  
`update-electron-app config looks good; aborting updates since app is in development mode`,  
sigue estos pasos:

1. **Eliminar dependencias existentes**  
  Ejecuta el siguiente comando para borrar los `node_modules` y el `package-lock.json`:

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

2. **Recompilar el módulo `better-sqlite3`**  
  Usa el siguiente comando para recompilar el módulo:

  ```bash
  npx electron-rebuild -f -w better-sqlite3
  ```

3. **Limpiar la caché de npm**  
  Finalmente, limpia la caché de npm con:

  ```bash
  npm cache clean --force
  ```

---
