import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ForbiddenPage, HomePage, LoginPage, ReportsPage } from './area-pages';
import { Session } from './session';

export const adminGuard: CanActivateFn = () => {
  const user = inject(Session).user();
  const router = inject(Router);

  if (!user) {
    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    return false;
  }
  if (user.role !== 'admin') {
    router.navigate(['/forbidden']);
    return false;
  }
  return true;
};

export const AREA_ROUTES: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'forbidden', component: ForbiddenPage },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: 'reports', component: ReportsPage, canActivate: [adminGuard] },
];
