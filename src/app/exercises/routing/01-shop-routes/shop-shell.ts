import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shop-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a [routerLink]="['products']">Products</a>
      <a [routerLink]="['checkout']">Checkout</a>
      <a [routerLink]="['account']">Account</a>
    </nav>
    <router-outlet />
  `,
})
export class ShopShell {}
