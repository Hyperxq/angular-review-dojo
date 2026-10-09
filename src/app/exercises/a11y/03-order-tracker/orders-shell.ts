import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-orders-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a routerLink="/" class="nav">Orders</a>
      <a routerLink="help" class="nav">Help</a>
    </nav>
    <main>
      <router-outlet />
    </main>
  `,
})
export class OrdersShell {}
