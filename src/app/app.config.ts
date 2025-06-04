import { ApplicationConfig } from '@angular/core';
import { provideCore } from './core/core';
import { routes } from './app-routing.module';

export const appConfig: ApplicationConfig = {
  providers: [provideCore({ routes })],
};
