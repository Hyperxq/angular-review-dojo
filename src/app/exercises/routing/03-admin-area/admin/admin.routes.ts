import { Routes } from '@angular/router';
import { AdminDashboard, AdminUsers } from './admin-pages';

export const ADMIN_ROUTES: Routes = [
  { path: '', component: AdminDashboard },
  { path: 'users', component: AdminUsers },
];
