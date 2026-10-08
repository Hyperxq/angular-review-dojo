import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../../../core/models';

const BULK_THRESHOLD = 5;
const BULK_DISCOUNT = 0.1;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<CartItem[]>([]);

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((n, i) => n + i.quantity, 0));
  readonly total = computed(() => {
    const subtotal = this.state().reduce((sum, i) => sum + i.price * i.quantity, 0);
    return this.count() >= BULK_THRESHOLD ? subtotal * (1 - BULK_DISCOUNT) : subtotal;
  });

  add(product: Product) {
    this.state.update((items) =>
      items.some((item) => item.productId === product.id)
        ? items.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }],
    );
  }

  remove(productId: number) {
    this.state.update((items) => items.filter((item) => item.productId !== productId));
  }

  clear() {
    this.state.set([]);
  }
}
