import { Component, inject } from '@angular/core';
import { OrdersStore } from './orders-store';

@Component({
  selector: 'app-orders-panel',
  template: `
    <button type="button" class="place" (click)="orders.place()">Place order</button>
    <p class="orders-count">Orders: {{ orders.placed().length }}</p>
  `,
})
export class OrdersPanel {
  protected readonly orders = inject(OrdersStore);
}
