import { Component, input, output } from '@angular/core';
import { CartItem } from '../../../core/models';

@Component({
  selector: 'app-cart-lines',
  template: `
    <ul>
      @for (item of items(); track item.productId) {
        <li>
          {{ item.quantity }} x {{ item.name }}
          <button type="button" (click)="remove.emit(item.productId)">Remove</button>
        </li>
      }
    </ul>
  `,
})
export class CartLines {
  readonly items = input.required<CartItem[]>();
  readonly remove = output<number>();
}
