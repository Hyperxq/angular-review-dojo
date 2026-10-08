import { Component, input, output } from '@angular/core';
import { OrderLine } from './order-line';

@Component({
  selector: 'app-line-list',
  template: `
    <ul>
      @for (line of lines(); track line.productId) {
        <li>
          <span class="name">{{ line.name }}</span>
          <button type="button" aria-label="Decrease" (click)="quantityChanged.emit({ index: $index, delta: -1 })">-</button>
          <span class="qty">{{ line.quantity }}</span>
          <button type="button" aria-label="Increase" (click)="quantityChanged.emit({ index: $index, delta: 1 })">+</button>
          <button type="button" aria-label="Remove" (click)="removed.emit($index)">Remove</button>
        </li>
      } @empty {
        <li>No lines yet</li>
      }
    </ul>
  `,
})
export class LineList {
  readonly lines = input.required<OrderLine[]>();
  readonly removed = output<number>();
  readonly quantityChanged = output<{ index: number; delta: number }>();
}
