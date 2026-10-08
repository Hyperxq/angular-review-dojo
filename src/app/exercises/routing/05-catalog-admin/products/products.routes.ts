import { CanDeactivateFn, Routes } from '@angular/router';
import { DraftStore } from '../draft-store';
import { GeneralTab, PricingTab, ProductsLayout } from './product-pages';

const confirmLeave: CanDeactivateFn<GeneralTab> = () =>
  confirm('You have unsaved changes. Leave anyway?');

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsLayout,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      {
        path: 'general',
        title: 'General',
        component: GeneralTab,
        providers: [DraftStore],
        canDeactivate: [confirmLeave],
      },
      { path: 'pricing', title: 'Pricing', component: PricingTab, providers: [DraftStore] },
    ],
  },
];
