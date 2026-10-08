import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { ProductDetailPage, ProductMissingPage } from './product-pages';

export const productResolver: ResolveFn<Product> = (route) => {
  const notFound = new RedirectCommand(inject(Router).parseUrl('/not-found'));
  return inject(ProductApi)
    .get(Number(route.paramMap.get('id')))
    .pipe(catchError(() => of(notFound)));
};

export const PRODUCT_PAGES_ROUTES: Routes = [
  { path: '', redirectTo: 'products/1', pathMatch: 'full' },
  { path: 'products/:id', component: ProductDetailPage, resolve: { product: productResolver } },
  { path: 'not-found', component: ProductMissingPage },
];
