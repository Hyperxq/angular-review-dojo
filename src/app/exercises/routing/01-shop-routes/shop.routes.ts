import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import {
  AccountPage,
  CartState,
  CheckoutPage,
  NewProductPage,
  NotFoundPage,
  ProductPage,
  ProductsPage,
} from './shop-pages';

export const cartNotEmpty: CanActivateFn = () => inject(CartState).count() > 0;

export const SHOP_ROUTES: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductsPage },
  { path: 'products/:id', component: ProductPage },
  { path: 'products/new', component: NewProductPage },
  { path: '**', component: NotFoundPage },
  { path: 'checkout', component: CheckoutPage, canActivate: [cartNotEmpty] },
  { path: 'account', component: AccountPage },
];
