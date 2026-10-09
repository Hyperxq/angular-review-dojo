import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDERS, OrderStatus } from './orders';

const COLORS: Record<OrderStatus, string> = {
  shipped: '#2e9e44',
  processing: '#e0a800',
  cancelled: '#d93025',
};

const LABELS: Record<OrderStatus, string> = {
  shipped: 'Shipped',
  processing: 'Processing',
  cancelled: 'Cancelled',
};

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink],
  template: `
    <h2>Your orders</h2>
    <label>
      Status
      <select (change)="filter.set($any($event.target).value)">
        <option value="">All</option>
        <option value="shipped">Shipped</option>
        <option value="processing">Processing</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </label>
    <p role="status">
      {{ visible().length }} {{ visible().length === 1 ? 'order' : 'orders' }} shown
    </p>
    <ul class="orders">
      @for (order of visible(); track order.id) {
        <li>
          <span class="dot" aria-hidden="true" [style.background]="colors[order.status]"></span>
          <a [routerLink]="[order.id]">Order #{{ order.id }}</a>
          <span class="status">{{ labels[order.status] }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .dot {
      display: inline-block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      margin-right: 0.5rem;
    }
  `,
})
export class OrdersList {
  protected readonly colors = COLORS;
  protected readonly labels = LABELS;
  protected readonly filter = signal('');
  protected readonly visible = computed(() =>
    ORDERS.filter((order) => !this.filter() || order.status === this.filter()),
  );
}
