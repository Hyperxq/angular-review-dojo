import { Routes } from '@angular/router';
import { OrderDetail, OrderHelp } from './order-pages';
import { OrdersList } from './orders-list';

export const ORDER_ROUTES: Routes = [
  { path: '', component: OrdersList, title: 'Orders' },
  { path: 'help', component: OrderHelp, title: 'Help' },
  { path: ':id', component: OrderDetail, title: (route) => `Order ${route.paramMap.get('id')}` },
];
