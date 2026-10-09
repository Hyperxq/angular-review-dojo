import { Service, inject, signal } from '@angular/core';
import { Product } from '../../../../core/models';
import { NotificationsStore } from '../notifications';

@Service()
export class WishlistStore {
  private readonly notifications = inject(NotificationsStore);
  private readonly _items = signal<Product[]>([]);

  readonly items = this._items.asReadonly();

  has(productId: number) {
    return this._items().some((p) => p.id === productId);
  }

  toggle(product: Product) {
    const wished = this.has(product.id);
    this._items.update((list) =>
      wished ? list.filter((p) => p.id !== product.id) : [...list, product],
    );
    this.notifications.notify(
      wished
        ? `${product.name} removed from your wishlist`
        : `${product.name} saved to your wishlist`,
    );
  }
}
