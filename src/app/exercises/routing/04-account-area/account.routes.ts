import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AccountSession } from './account-data';
import {
  AccountLayout,
  AccountLoginPage,
  OrderDetailPage,
  OrdersPage,
  ProfilePage,
} from './account-pages';

export const signedIn: CanActivateFn = () =>
  inject(AccountSession).signedIn() || inject(Router).createUrlTree(['/login']);

export const ACCOUNT_ROUTES: Routes = [
  { path: 'login', component: AccountLoginPage },
  {
    path: 'account/:customerId',
    component: AccountLayout,
    canActivate: [signedIn],
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'orders',
        component: OrdersPage,
        children: [{ path: ':orderId', component: OrderDetailPage }],
      },
      { path: 'profile', component: ProfilePage },
    ],
  },
];
