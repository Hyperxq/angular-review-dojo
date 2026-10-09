import { Component, inject, signal } from '@angular/core';
import { OrdersClient } from './orders-client';
import { Toasts } from './orders-http';

@Component({
  selector: 'app-orders-demo',
  template: `
    <button type="button" class="place" (click)="place()">Place order</button>
    <p class="result">{{ result() }}</p>
    <ul class="toasts">
      @for (message of toasts.messages(); track $index) {
        <li role="status">{{ message }}</li>
      }
    </ul>
  `,
})
export class OrdersDemo {
  private readonly client = inject(OrdersClient);
  protected readonly toasts = inject(Toasts);
  protected readonly result = signal('');

  protected place() {
    this.client.place({ lines: [{ productId: 1, quantity: 1 }] }).subscribe({
      next: (receipt) => this.result.set(`Order #${receipt.orderId} placed`),
      error: () => this.result.set('Order failed'),
    });
  }
}
