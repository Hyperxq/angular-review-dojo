import { Product } from '../../../core/models';

export interface Variant {
  id: string;
  label: string;
  priceDelta: number;
}

export function variantsFor(product: Product): Variant[] {
  return [
    { id: 'standard', label: 'Standard', priceDelta: 0 },
    { id: 'bundle', label: 'Bundle', priceDelta: Math.round(product.price * 0.25) },
    { id: 'limited', label: 'Limited edition', priceDelta: 20 },
  ];
}
