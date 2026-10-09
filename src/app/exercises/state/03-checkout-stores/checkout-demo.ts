import { Component, inject } from '@angular/core';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { CartStore } from './cart-store';
import { Session } from './session';
import { StockStore } from './stock-store';

@Component({
  selector: 'app-checkout-demo',
  template: `
    <p class="who">
      @if (session.userId(); as user) {
        Signed in as {{ user }}
        <button type="button" (click)="session.logout()">Sign out</button>
      } @else {
        <button type="button" (click)="session.login('ana')">Sign in as Ana</button>
        <button type="button" (click)="session.login('marcus')">Sign in as Marcus</button>
      }
    </p>
    <p class="count">Cart: {{ cart.count() }}</p>
    @if (cart.error(); as error) {
      <p role="alert">{{ error }}</p>
    }
    <ul>
      @for (product of products; track product.id) {
        <li>
          {{ product.name }} ({{ stock.stock()[product.id] ?? '…' }} left)
          <button type="button" (click)="cart.add(product.id)">Add to cart</button>
        </li>
      }
    </ul>
  `,
})
export class CheckoutDemo {
  protected readonly session = inject(Session);
  protected readonly cart = inject(CartStore);
  protected readonly stock = inject(StockStore);
  protected readonly products = SEED_PRODUCTS.slice(0, 3);

  constructor() {
    this.stock.load();
  }
}
