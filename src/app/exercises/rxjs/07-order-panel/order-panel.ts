import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, filter, map } from 'rxjs';
import { ProductApi } from '../../../core/product-api';
import { OrderLineDraft, lineTotal$, placeOrder$ } from './order-streams';
import { withPrevious } from './with-previous';

@Component({
  selector: 'app-order-panel',
  imports: [CurrencyPipe],
  template: `
    @if (product(); as product) {
      <h2>{{ product.name }}</h2>
      <div>
        <button type="button" id="less" (click)="quantity.set(quantity() - 1)" [disabled]="quantity() <= 1">-</button>
        <span id="quantity">{{ quantity() }}</span>
        <button type="button" id="more" (click)="quantity.set(quantity() + 1)">+</button>
      </div>
      <p>Total: {{ total() | currency }}</p>
      <p>Change since last edit: {{ delta() | currency }}</p>
      <button type="button" id="place" (click)="clicks.next()">Place order</button>
      @if (receipt(); as receipt) {
        <p role="status">Order #{{ receipt.orderId }} placed</p>
      }
    }
  `,
})
export class OrderPanel {
  private readonly api = inject(ProductApi);

  protected readonly clicks = new Subject<void>();
  protected readonly quantity = signal(1);
  protected readonly product = toSignal(this.api.get(4));

  private readonly line$ = toObservable(
    computed((): OrderLineDraft | undefined => {
      const product = this.product();
      return product && { product, quantity: this.quantity() };
    }),
  ).pipe(filter((line) => !!line));

  protected readonly total = toSignal(lineTotal$(this.line$));
  protected readonly delta = toSignal(
    lineTotal$(this.line$).pipe(
      withPrevious(),
      map(([previous, current]) => (previous === undefined ? 0 : current - previous)),
    ),
  );
  protected readonly receipt = toSignal(
    placeOrder$(this.clicks, this.line$, (order) => this.api.submitOrder(order)),
  );
}
