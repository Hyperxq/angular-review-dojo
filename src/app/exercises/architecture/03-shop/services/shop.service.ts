import { Service, computed, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../../core/fake-backend';
import { Product } from '../../../../core/models';
import { CartLine, PlacedOrder, ShopNotification } from '../models/shop.models';
import { formatPrice } from '../utils/money';

@Service()
export class ShopService {
  // catalog
  readonly query = signal('');
  readonly visibleProducts = computed(() => {
    const term = this.query().toLowerCase();
    return SEED_PRODUCTS.filter((p) => p.name.toLowerCase().includes(term));
  });

  setQuery(query: string) {
    this.query.set(query);
  }

  // cart
  private readonly _cart = signal<CartLine[]>([]);
  readonly cart = this._cart.asReadonly();
  readonly cartCount = computed(() => this._cart().reduce((n, l) => n + l.quantity, 0));
  readonly cartTotal = computed(() =>
    this._cart().reduce((sum, l) => sum + l.product.price * l.quantity, 0),
  );

  addToCart(product: Product) {
    this._cart.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      return existing
        ? lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { product, quantity: 1 }];
    });
    this.notify(`${product.name} added to your cart`);
  }

  removeFromCart(productId: number) {
    this._cart.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  // wishlist
  private readonly _wishlist = signal<Product[]>([]);
  readonly wishlist = this._wishlist.asReadonly();

  isWished(productId: number) {
    return this._wishlist().some((p) => p.id === productId);
  }

  toggleWishlist(product: Product) {
    const wished = this.isWished(product.id);
    this._wishlist.update((list) =>
      wished ? list.filter((p) => p.id !== product.id) : [...list, product],
    );
    this.notify(
      wished
        ? `${product.name} removed from your wishlist`
        : `${product.name} saved to your wishlist`,
    );
  }

  // notifications
  private nextNotificationId = 1;
  private readonly _notifications = signal<ShopNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  notify(message: string) {
    this._notifications.update((list) => [...list, { id: this.nextNotificationId++, message }]);
  }

  dismiss(id: number) {
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }

  // orders
  private readonly _orders = signal<PlacedOrder[]>([]);
  readonly orders = this._orders.asReadonly();

  placeOrder() {
    const lines = this._cart();
    if (lines.length === 0) {
      return;
    }
    const order = { id: this._orders().length + 1, lines, total: this.cartTotal() };
    this._orders.update((list) => [...list, order]);
    this._cart.set([]);
    this.notify(`Order #${order.id} placed: ${formatPrice(order.total)}`);
  }

  // formatting
  formatPrice(amount: number) {
    return formatPrice(amount);
  }
}
