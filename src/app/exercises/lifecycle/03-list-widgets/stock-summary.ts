import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-stock-summary',
  template: `
    <h3>Stock</h3>
    @if (stock.error()) {
      <p role="alert">Could not load the stock.</p>
    } @else if (summary(); as s) {
      <p data-testid="total">{{ s.total }} units in stock</p>
      <p data-testid="sold-out">{{ s.soldOut }} sold out</p>
    }
  `,
})
export class StockSummary {
  private readonly api = inject(ProductApi);

  protected readonly stock = rxResource({ stream: () => this.api.stock() });
  protected readonly summary = computed(() => {
    const stock = this.stock.value();
    if (!stock) {
      return null;
    }
    const levels = Object.values(stock);
    return {
      total: levels.reduce((sum, level) => sum + level, 0),
      soldOut: levels.filter((level) => level === 0).length,
    };
  });
}
