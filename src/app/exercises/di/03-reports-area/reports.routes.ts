import {
  provideHttpClient,
  withInterceptors,
  withRequestsMadeViaParent,
} from '@angular/common/http';
import { Routes } from '@angular/router';
import { ReportsPage, reportsScopeInterceptor } from './reports-page';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: ReportsPage,
    providers: [
      provideHttpClient(withRequestsMadeViaParent(), withInterceptors([reportsScopeInterceptor])),
    ],
  },
];
