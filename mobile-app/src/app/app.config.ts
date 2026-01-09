// frontend/src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // ← ESTO ES CRÍTICO
    importProvidersFrom(IonicModule.forRoot({})),
     provideIonicAngular({}),
  ]
};