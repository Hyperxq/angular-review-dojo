import {
  provideHttpClient,
  withInterceptors,
  withRequestsMadeViaParent,
} from '@angular/common/http';
import { Routes } from '@angular/router';
import { alertsDemoBackend } from './alerts-demo-backend';
import { AlertsPage } from './alerts-page';

export const ALERT_ROUTES: Routes = [
  {
    path: '',
    component: AlertsPage,
    providers: [
      provideHttpClient(withRequestsMadeViaParent(), withInterceptors([alertsDemoBackend])),
    ],
  },
];
