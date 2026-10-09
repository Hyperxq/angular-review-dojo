import { InvoiceService } from '../features/billing';
import { formatMoney } from './money';

export function describeInvoice(invoice: InvoiceService, productId: number, quantity: number) {
  return `${quantity} x #${productId}: ${formatMoney(invoice.totalFor(productId, quantity))}`;
}
