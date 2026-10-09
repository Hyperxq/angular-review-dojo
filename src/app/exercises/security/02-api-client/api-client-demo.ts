import { Component, inject, signal } from '@angular/core';
import { OrdersApi } from './orders-api';

@Component({
  selector: 'app-api-client-demo',
  template: `
    <h2>Checkout</h2>
    <button type="button" (click)="place()">Place order</button>
    <p>{{ message() }}</p>
  `,
})
export class ApiClientDemo {
  private readonly api = inject(OrdersApi);

  protected readonly message = signal('');

  protected place() {
    this.api.trackView('/checkout').subscribe({ error: () => undefined });
    this.api.place({ lines: [{ productId: 1, quantity: 1 }] }).subscribe({
      next: (receipt) => this.message.set(`Order #${receipt.orderId} placed`),
      error: () => this.message.set('We could not place your order.'),
    });
  }
}
