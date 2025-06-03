console.log('fromPreload:', (window as any).fromPreload);
console.log('electronAPI:', (window as any).electronAPI);


import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
