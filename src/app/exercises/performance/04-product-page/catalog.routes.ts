import { Routes } from '@angular/router';
import { AdminToolsPage } from './catalog-pages';
import { ProductDetailPage } from './product-detail-page';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: ProductDetailPage },
  { path: 'admin', component: AdminToolsPage },
  {
    path: 'reports',
    loadComponent: () => import('./catalog-pages').then((m) => m.ReportsPage),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./catalog-pages').then((m) => m.CheckoutPage),
  },
];
