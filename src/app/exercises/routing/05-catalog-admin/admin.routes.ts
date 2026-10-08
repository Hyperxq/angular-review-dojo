import { Routes } from '@angular/router';
import { AdminLayout, DashboardPage, HelpPanel } from './admin-pages';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPage },
      {
        path: 'products',
        loadChildren: () => import('./products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      { path: 'help', outlet: 'aside', component: HelpPanel },
    ],
  },
];
