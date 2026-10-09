import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Routes } from '@angular/router';
import { ReportsPage, reportsScopeInterceptor } from './reports-page';
import { AuditLog } from './shared';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: ReportsPage,
    providers: [provideHttpClient(withInterceptors([reportsScopeInterceptor])), AuditLog],
  },
];
