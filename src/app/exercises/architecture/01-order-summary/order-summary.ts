import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { PricedLine, priceOrder } from './order-pricing';

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
    <p class="subtotal">Subtotal {{ totals().subtotal | currency }}</p>
    @if (totals().discount) {
      <p class="discount">Volume discount -{{ totals().discount | currency }}</p>
    }
    <p class="total">Total {{ totals().total | currency }}</p>
    <button type="button" (click)="confirm.emit()">Confirm order</button>
  `,
})
export class OrderSummary {
  readonly lines = input.required<PricedLine[]>();
  readonly stock = input<Record<number, number>>({});
  readonly confirm = output<void>();

  protected readonly totals = computed(() => priceOrder(this.lines()));
}
