import { Injectable } from '@angular/core';
import { Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class Pricing {
  /** Applies the clearance rules. */
  discountedPrice(product: Product): number {
    let price = product.price;
    for (let i = 0; i < 20_000; i++) {
      price = Math.round(price * 100) / 100;
    }
    return product.stock <= 2 ? price * 0.8 : price;
  }
}
