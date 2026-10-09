import { Service } from '@angular/core';
import { SEED_PRODUCTS } from '../../../../../../core/fake-backend';

@Service()
export class PriceList {
  priceOf(productId: number) {
    return SEED_PRODUCTS.find((p) => p.id === productId)?.price ?? 0;
  }
}
