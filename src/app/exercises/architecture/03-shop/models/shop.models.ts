import { Product } from '../../../../core/models';

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface ShopNotification {
  id: number;
  message: string;
}

export interface PlacedOrder {
  id: number;
  lines: CartLine[];
  total: number;
}
