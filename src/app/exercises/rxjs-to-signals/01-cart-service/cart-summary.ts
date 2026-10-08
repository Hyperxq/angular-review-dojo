import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CartLines } from './cart-lines';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyPipe, CartLines],
  template: `
    <h2>Cart (<span id="count">{{ cart.count() }}</span>)</h2>
    <app-cart-lines [items]="cart.items()" (remove)="cart.remove($event)" />
    <p id="total">Total: {{ cart.total() | currency }}</p>
    <button type="button" id="clear" (click)="cart.clear()">Clear cart</button>
  `,
})
export class CartSummary {
  protected readonly cart = inject(CartService);
}
