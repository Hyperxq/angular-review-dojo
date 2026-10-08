import { Component, inject, input, signal } from '@angular/core';
import { Order, OrderReceipt } from '../../../core/models';
import { OrderClient } from './order-client';

@Component({
  selector: 'app-place-order-button',
  template: `
    <button type="button" class="btn btn-primary" [disabled]="status() === 'placing'" (click)="place()">
      Place order
    </button>
    @switch (status()) {
      @case ('placing') {
        <p class="msg">Placing your order…</p>
      }
      @case ('placed') {
        <p class="msg msg-ok" role="status">Order #{{ receipt()?.orderId }} placed</p>
      }
      @case ('failed') {
        <p class="msg msg-error" role="alert">We could not place your order.</p>
      }
    }
  `,
})
export class PlaceOrderButton {
  private readonly client = inject(OrderClient);

  readonly order = input.required<Order>();

  protected readonly status = signal<'idle' | 'placing' | 'placed' | 'failed'>('idle');
  protected readonly receipt = signal<OrderReceipt | null>(null);

  protected place() {
    this.status.set('placing');
    this.client.submit(this.order()).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.status.set('placed');
        setTimeout(() => this.status.set('idle'), 3000);
      },
      error: () => this.status.set('failed'),
    });
  }
}
