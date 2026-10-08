import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart-panel',
  imports: [CurrencyPipe],
  providers: [CartStore],
  template: `
    <h2>Cart</h2>
    <ul class="catalog">
      @for (product of products(); track product.id) {
        <li>
          {{ product.name }} ({{ available(product.id, product.stock) }} left)
          <button
            type="button"
            [disabled]="available(product.id, product.stock) <= 0"
            (click)="store.add(product)"
          >
            Add
          </button>
        </li>
      }
    </ul>
    <ul class="cart">
      @for (item of state()?.items; track item.productId) {
        <li>
          {{ item.quantity }} x {{ item.name }}
          <button type="button" (click)="store.remove(item.productId)">Remove</button>
        </li>
      }
    </ul>
    <p>Total: {{ total() | currency }}</p>
  `,
})
export class CartPanel {
  protected readonly store = inject(CartStore);
  protected readonly products = toSignal(inject(ProductApi).list(), { initialValue: [] });
  protected readonly state = toSignal(this.store.state$);

  protected readonly total = computed(() =>
    (this.state()?.items ?? []).reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  protected available(productId: number, fallback: number) {
    return this.state()?.stock[productId] ?? fallback;
  }
}
