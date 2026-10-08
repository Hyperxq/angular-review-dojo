import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-product-pages-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <a [routerLink]="['products', 1]">Product 1</a>
      <a [routerLink]="['products', 4]">Product 4</a>
      <a [routerLink]="['products', 99]">Product 99</a>
    </nav>
    <router-outlet />
  `,
})
export class ProductPagesShell {}
