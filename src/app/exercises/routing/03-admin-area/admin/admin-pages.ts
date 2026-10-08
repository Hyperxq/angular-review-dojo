import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
    <h2>Admin dashboard</h2>
    <a [routerLink]="['users']">Manage users</a>
  `,
})
export class AdminDashboard {}

@Component({
  selector: 'app-admin-users',
  template: `<h2>Manage users</h2>`,
})
export class AdminUsers {}
