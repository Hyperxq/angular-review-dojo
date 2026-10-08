import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { ProductDetailPage, ProductMissingPage } from './product-pages';

export const productResolver: ResolveFn<Product> = (route) =>
  inject(ProductApi).get(Number(route.paramMap.get('id')));

export const PRODUCT_PAGES_ROUTES: Routes = [
  { path: '', redirectTo: 'products/1', pathMatch: 'full' },
  { path: 'products/:id', component: ProductDetailPage, resolve: { product: productResolver } },
  { path: 'not-found', component: ProductMissingPage },
];
