import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { CartLineRow } from './cart-line-row';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-demo',
  imports: [CartLineRow, CurrencyPipe],
  template: `
    <h2>Cart</h2>
    @for (product of products; track product.id) {
      <button type="button" (click)="cart.add(product)">Add {{ product.name }}</button>
    }
    <ul>
      @for (line of cart.items(); track $index) {
        <li>
          <app-cart-line-row [line]="line" />
          <button type="button" (click)="cart.remove(line.productId)">Remove</button>
        </li>
      }
    </ul>
    <p>{{ cart.count() }} items, total {{ cart.total() | currency }}</p>
  `,
})
export class CartDemo {
  protected readonly cart = inject(CartStore);
  protected readonly products = SEED_PRODUCTS.slice(0, 3);
}
