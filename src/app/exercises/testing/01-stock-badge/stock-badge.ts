import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stock-badge',
  template: `<span class="badge" [class.badge-warn]="stock() <= 5">{{ label() }}</span>`,
})
export class StockBadge {
  readonly stock = input.required<number>();

  protected readonly label = computed(() => {
    const stock = this.stock();
    if (stock <= 5) {
      return 'Low stock';
    }
    return 'In stock';
  });
}
