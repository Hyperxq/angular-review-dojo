import { Component, computed, input } from '@angular/core';
import { LOW_STOCK_THRESHOLD } from './low-stock.store';

@Component({
  selector: 'app-stock-badge',
  template: `<span class="badge" [class.badge-warn]="stock() <= threshold">{{ label() }}</span>`,
})
export class StockBadge {
  protected readonly threshold = LOW_STOCK_THRESHOLD;
  readonly stock = input.required<number>();

  protected readonly label = computed(() => {
    const stock = this.stock();
    if (stock === 0) {
      return 'Out of stock';
    }
    return stock <= LOW_STOCK_THRESHOLD ? 'Low stock' : 'In stock';
  });
}
