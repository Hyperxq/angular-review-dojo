import { Service, signal } from '@angular/core';

export interface ShopNotification {
  id: number;
  message: string;
}

@Service()
export class NotificationsStore {
  private nextId = 1;
  private readonly _items = signal<ShopNotification[]>([]);

  readonly items = this._items.asReadonly();

  notify(message: string) {
    this._items.update((list) => [...list, { id: this.nextId++, message }]);
  }

  dismiss(id: number) {
    this._items.update((list) => list.filter((n) => n.id !== id));
  }
}
