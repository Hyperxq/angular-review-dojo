import { Component, OnInit, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductApi } from '../../../core/product-api';

interface Summary {
  total: number;
  soldOut: number;
}

@Component({
  selector: 'app-stock-summary',
  template: `
    <h3>Stock</h3>
    <p data-testid="total">{{ summary.total }} units in stock</p>
    <p data-testid="sold-out">{{ summary.soldOut }} sold out</p>
  `,
})
export class StockSummary implements OnInit {
  private readonly api = inject(ProductApi);

  protected summary!: Summary;

  async ngOnInit() {
    const stock = await firstValueFrom(this.api.stock());
    const levels = Object.values(stock);
    this.summary = {
      total: levels.reduce((sum, level) => sum + level, 0),
      soldOut: levels.filter((level) => level === 0).length,
    };
  }
}
