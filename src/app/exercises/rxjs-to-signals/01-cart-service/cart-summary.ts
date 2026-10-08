import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartLines } from './cart-lines';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart-summary',
  imports: [AsyncPipe, CurrencyPipe, CartLines],
  template: `
    <h2>Cart (<span id="count">{{ cart.count$ | async }}</span>)</h2>
    <app-cart-lines [items]="items()" (remove)="cart.remove($event)" />
    <p id="total">Total: {{ cart.total$ | async | currency }}</p>
    <button type="button" id="clear" (click)="cart.clear()">Clear cart</button>
  `,
})
export class CartSummary {
  protected readonly cart = inject(CartService);
  protected readonly items = toSignal(this.cart.items$, { initialValue: [] });
}
