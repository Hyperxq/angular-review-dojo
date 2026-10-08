import { inject } from '@angular/core';
import { CanDeactivateFn, Routes } from '@angular/router';
import { DraftStore } from '../draft-store';
import { GeneralTab, PricingTab, ProductsLayout } from './product-pages';

const confirmLeave: CanDeactivateFn<ProductsLayout> = () =>
  !inject(DraftStore).dirty() || confirm('You have unsaved changes. Leave anyway?');

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsLayout,
    providers: [DraftStore],
    canDeactivate: [confirmLeave],
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      {
        path: 'general',
        title: 'General',
        component: GeneralTab,
      },
      { path: 'pricing', title: 'Pricing', component: PricingTab },
    ],
  },
];
