import { Component, inject } from '@angular/core';
import { formatPrice } from '../shared/money';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-panel',
  template: `
    <h3>Cart</h3>
    <p class="cart-count">Cart ({{ cart.count() }})</p>
    <ul class="cart-lines">
      @for (line of cart.lines(); track line.product.id) {
        <li>
          {{ line.quantity }} x {{ line.product.name }}
          <button type="button" (click)="cart.remove(line.product.id)">
            Remove {{ line.product.name }}
          </button>
        </li>
      }
    </ul>
    <p class="cart-total">Total {{ price(cart.total()) }}</p>
  `,
})
export class CartPanel {
  protected readonly cart = inject(CartStore);
  protected readonly price = formatPrice;
}
