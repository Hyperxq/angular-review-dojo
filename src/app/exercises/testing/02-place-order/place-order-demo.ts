import { Component } from '@angular/core';
import { Order } from '../../../core/models';
import { PlaceOrderButton } from './place-order-button';

@Component({
  selector: 'app-place-order-demo',
  imports: [PlaceOrderButton],
  template: `
    <h2>Your cart</h2>
    <p>2 x Keychron K2 Keyboard, 1 x Glorious Model O</p>
    <app-place-order-button [order]="order" />
  `,
})
export class PlaceOrderDemo {
  protected readonly order: Order = {
    lines: [
      { productId: 1, quantity: 2 },
      { productId: 6, quantity: 1 },
    ],
  };
}
