import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a [routerLink]="['dashboard']">Dashboard</a>
      <a [routerLink]="['products', 'general']">Products</a>
      <a [routerLink]="[{ outlets: { aside: ['help'] } }]">Help</a>
    </nav>
    <main><router-outlet /></main>
    <aside><router-outlet name="aside" /></aside>
  `,
})
export class AdminLayout {}

@Component({
  selector: 'app-admin-dashboard-page',
  template: `<h2>Dashboard</h2>`,
})
export class DashboardPage {}

@Component({
  selector: 'app-admin-help-panel',
  template: `<h3>Keyboard shortcuts</h3>`,
})
export class HelpPanel {}
