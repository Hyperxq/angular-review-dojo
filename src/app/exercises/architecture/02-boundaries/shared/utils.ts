import { formatMoney } from './money';

export function describeInvoice(total: number, productId: number, quantity: number) {
  return `${quantity} x #${productId}: ${formatMoney(total)}`;
}
