import { Component, inject } from '@angular/core';
import { InvoiceService } from './features/billing';
import { ProductSearch } from './features/catalog';
import { ShippingCalculator } from './features/shipping';
import { describeInvoice } from './shared/utils';
import { formatMoney } from './shared/money';

@Component({
  selector: 'app-boundaries-demo',
  template: `
    <p class="invoice">{{ invoice }}</p>
    <p class="price">Keychron with tax: {{ price }}</p>
    <p class="shipping">Shipping 2 kg: {{ shipping }}</p>
  `,
})
export class BoundariesDemo {
  private readonly billing = inject(InvoiceService);
  protected readonly invoice = describeInvoice(this.billing.totalFor(1, 2), 1, 2);
  protected readonly price = formatMoney(inject(ProductSearch).priceWithTax(1));
  protected readonly shipping = inject(ShippingCalculator).quote(2);
}
