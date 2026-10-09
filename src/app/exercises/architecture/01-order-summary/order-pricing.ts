export interface PricedLine {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const DISCOUNT_THRESHOLD = 500;
const DISCOUNT_RATE = 0.1;
const TAX_RATE = 0.21;

const cents = (amount: number) => Math.round(amount * 100) / 100;

export function priceOrder(lines: readonly PricedLine[]): OrderTotals {
  const subtotal = cents(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const discount = subtotal >= DISCOUNT_THRESHOLD ? cents(subtotal * DISCOUNT_RATE) : 0;
  const tax = cents((subtotal - discount) * TAX_RATE);
  return { subtotal, discount, tax, total: cents(subtotal - discount + tax) };
}
