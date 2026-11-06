import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { alertsDemoBackend } from './exercises/capstone/01-price-alerts/alerts-demo-backend';
import { fakeBackendInterceptor } from './core/fake-backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([alertsDemoBackend, fakeBackendInterceptor])),
  ],
};
