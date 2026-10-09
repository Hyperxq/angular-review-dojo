import { Service, inject } from '@angular/core';
import { PriceList } from '../catalog';
import { TAX_RATE } from '../../shared/tax';

@Service()
export class InvoiceService {
  private readonly prices = inject(PriceList);

  totalFor(productId: number, quantity: number) {
    return this.prices.priceOf(productId) * quantity * (1 + TAX_RATE);
  }
}
