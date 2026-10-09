import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ProductApi } from '../../../core/product-api';
import { Session } from './session';
import { StockStore } from './stock-store';

const ownerOf = (userId: string | null) => userId ?? 'guest';

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState({
    carts: {} as Record<string, Record<number, number>>,
    error: null as string | null,
  }),
  withComputed(({ carts }) => {
    const session = inject(Session);
    const items = computed(() => carts()[ownerOf(session.userId())] ?? {});
    return {
      items,
      count: computed(() => Object.values(items()).reduce((sum, qty) => sum + qty, 0)),
    };
  }),
  withMethods(
    (store, stock = inject(StockStore), api = inject(ProductApi), session = inject(Session)) => {
      const change = (owner: string, productId: number, delta: number) =>
        patchState(store, (state) => {
          const cart = state.carts[owner] ?? {};
          return {
            carts: {
              ...state.carts,
              [owner]: { ...cart, [productId]: (cart[productId] ?? 0) + delta },
            },
          };
        });

      return {
        add(productId: number) {
          const owner = ownerOf(session.userId());
          stock.adjust(productId, -1);
          change(owner, productId, 1);
          patchState(store, { error: null });
          api.reserve(productId).subscribe({
            error: () => {
              stock.adjust(productId, 1);
              change(owner, productId, -1);
              patchState(store, { error: 'Could not reserve the item.' });
            },
          });
        },
      };
    },
  ),
);
