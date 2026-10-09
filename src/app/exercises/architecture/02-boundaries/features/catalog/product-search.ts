import { Service, inject } from '@angular/core';
import { TAX_RATE } from '../billing';
import { PriceList } from './internal/price-list';

@Service()
export class ProductSearch {
  private readonly prices = inject(PriceList);

  priceWithTax(productId: number) {
    return this.prices.priceOf(productId) * (1 + TAX_RATE);
  }
}
