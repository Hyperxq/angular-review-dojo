import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ProductApi } from '../../../core/product-api';
import { StockStore } from './stock-store';

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState({ items: {} as Record<number, number>, error: null as string | null }),
  withComputed(({ items }) => ({
    count: computed(() => Object.values(items()).reduce((sum, qty) => sum + qty, 0)),
  })),
  withMethods((store, stock = inject(StockStore), api = inject(ProductApi)) => ({
    add(productId: number) {
      const before = stock.snapshot();
      stock.take(productId);
      patchState(store, (state) => ({
        items: { ...state.items, [productId]: (state.items[productId] ?? 0) + 1 },
        error: null,
      }));
      api.reserve(productId).subscribe({
        error: () => {
          stock.restore(before);
          patchState(store, { error: 'Could not reserve the item.' });
        },
      });
    },
  })),
);
