import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';
import { PricedLine } from './order-pricing';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <table class="lines">
      @for (line of lines(); track line.productId) {
        <tr>
          <td>{{ line.name }}</td>
          <td>{{ line.quantity }} x {{ line.unitPrice | currency }}</td>
          <td class="stock">
            @if ((stock()[line.productId] ?? 99) < 5) {
              Only {{ stock()[line.productId] }} left
            }
          </td>
        </tr>
      }
    </table>
    <p class="subtotal">Subtotal {{ subtotal() | currency }}</p>
    @if (subtotal() > 500) {
      <p class="discount">Volume discount -{{ subtotal() * 0.1 | currency }}</p>
    }
    <p class="total">
      Total {{ (subtotal() > 500 ? subtotal() * 0.9 : subtotal()) * 1.21 | currency }}
    </p>
    <button type="button" (click)="confirm.emit()">Confirm order</button>
  `,
})
export class OrderSummary {
  readonly lines = input.required<PricedLine[]>();
  readonly confirm = output<void>();

  protected readonly stock = toSignal(inject(ProductApi).stock(), {
    initialValue: {} as Record<number, number>,
  });
  protected readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
}
