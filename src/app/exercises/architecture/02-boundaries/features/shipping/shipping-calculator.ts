import { Service } from '@angular/core';
import { formatMoney } from '../../shared/money';

@Service()
export class ShippingCalculator {
  quote(weightKg: number) {
    return formatMoney(4.5 + weightKg * 1.2);
  }
}
