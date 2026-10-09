import { Routes } from '@angular/router';
import { OrderDetail, OrderHelp } from './order-pages';
import { OrdersList } from './orders-list';

export const ORDER_ROUTES: Routes = [
  { path: '', component: OrdersList },
  { path: 'help', component: OrderHelp },
  { path: ':id', component: OrderDetail },
];
