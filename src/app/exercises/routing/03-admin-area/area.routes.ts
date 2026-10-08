import { inject } from '@angular/core';
import { CanMatchFn, Router, Routes } from '@angular/router';
import { ForbiddenPage, HomePage, LoginPage } from './area-pages';
import { Session } from './session';

export const adminGuard: CanMatchFn = (_route, segments) => {
  const user = inject(Session).user();
  const router = inject(Router);

  if (!user) {
    const returnUrl = '/' + segments.map((s) => s.path).join('/');
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
  if (user.role !== 'admin') {
    return router.createUrlTree(['/forbidden']);
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
    canMatch: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'reports',
    canMatch: [adminGuard],
    loadComponent: () => import('./area-pages').then((m) => m.ReportsPage),
  },
];
