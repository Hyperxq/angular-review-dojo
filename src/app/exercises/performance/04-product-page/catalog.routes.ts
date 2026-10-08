import { Routes } from '@angular/router';
import { ProductDetailPage } from './product-detail-page';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: ProductDetailPage },
  {
    path: 'admin',
    loadComponent: () => import('./catalog-pages').then((m) => m.AdminToolsPage),
  },
  {
    path: 'reports',
    loadComponent: () => import('./catalog-pages').then((m) => m.ReportsPage),
  },
  {
    path: 'checkout',
    data: { preload: true },
    loadComponent: () => import('./catalog-pages').then((m) => m.CheckoutPage),
  },
];
