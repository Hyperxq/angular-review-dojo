import { Injectable } from '@angular/core';

export interface DraftLine {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface DraftOrder {
  lines: DraftLine[];
}

@Injectable({ providedIn: 'root' })
export class OrderMath {
  static readonly TAX_RATE = 0.2;

  subtotal(order: DraftOrder): number {
    return order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }

  tax(order: DraftOrder): number {
    return this.subtotal(order) * OrderMath.TAX_RATE;
  }

  total(order: DraftOrder): number {
    return this.subtotal(order) + this.tax(order);
  }
}
