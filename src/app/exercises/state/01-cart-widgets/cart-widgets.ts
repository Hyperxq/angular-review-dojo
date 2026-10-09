import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { CartState } from './cart-state';

@Component({
  selector: 'app-product-tile',
  imports: [CurrencyPipe],
  template: `
    <span>{{ product().name }} ({{ product().price | currency }})</span>
    <button type="button" [attr.aria-label]="'Add ' + product().name" (click)="cart.add(product())">
      Add
    </button>
  `,
})
export class ProductTile {
  protected readonly cart = inject(CartState);
  readonly product = input.required<Product>();
}

@Component({
  selector: 'app-cart-badge',
  template: `<span class="badge">Cart ({{ cart.count() }})</span>`,
})
export class CartBadge {
  protected readonly cart = inject(CartState);
}

@Component({
  selector: 'app-cart-total',
  imports: [CurrencyPipe],
  template: `<span class="total">Total: {{ cart.total() | currency }}</span>`,
})
export class CartTotal {
  protected readonly cart = inject(CartState);
}

@Component({
  selector: 'app-cart-lines',
  template: `
    <ul class="lines">
      @for (item of cart.items(); track item.productId) {
        <li>
          {{ item.quantity }} x {{ item.name }}
          <button
            type="button"
            [attr.aria-label]="'Remove ' + item.name"
            (click)="cart.remove(item.productId)"
          >
            Remove
          </button>
        </li>
      }
    </ul>
  `,
})
export class CartLines {
  protected readonly cart = inject(CartState);
}

@Component({
  selector: 'app-cart-widgets-demo',
  imports: [ProductTile, CartBadge, CartTotal, CartLines],
  template: `
    <header><app-cart-badge /> <app-cart-total /></header>
    <ul class="products">
      @for (product of products; track product.id) {
        <li><app-product-tile [product]="product" /></li>
      }
    </ul>
    <app-cart-lines />
  `,
})
export class CartWidgetsDemo {
  protected readonly products = SEED_PRODUCTS.slice(0, 3);
}
