import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h2>{{ product().name }}</h2>
    <nav>
      <a [routerLink]="[]" [queryParams]="{ tab: 'details' }">Details</a>
      <a [routerLink]="[]" [queryParams]="{ tab: 'stock' }">Stock</a>
    </nav>
    @if (tab() === 'stock') {
      <p>{{ product().stock }} units in stock</p>
    } @else {
      <p>{{ product().price | currency }} - {{ product().category }}</p>
    }
    <a [routerLink]="['../', product().id + 1]">Next product</a>
  `,
})
export class ProductDetailPage {
  readonly product = input.required<Product>();
  readonly tab = input<string>();
}

@Component({
  selector: 'app-product-missing-page',
  template: `<h2>We could not find that product</h2>`,
})
export class ProductMissingPage {}
