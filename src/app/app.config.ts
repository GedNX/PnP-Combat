import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideCore } from './core/core';
import { routes } from './app-routing.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCore({ routes }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
