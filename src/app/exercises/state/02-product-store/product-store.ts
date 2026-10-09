import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withEntities<Product>(),
  withState({ selectedId: null as number | null, filter: '', loading: false }),
  withComputed(({ entities, entityMap, selectedId, filter }) => ({
    count: computed(() => entities().length),
    inventoryValue: computed(() => entities().reduce((sum, p) => sum + p.price * p.stock, 0)),
    selected: computed(() => {
      const id = selectedId();
      return id === null ? null : (entityMap()[id] ?? null);
    }),
    visible: computed(() => {
      const term = filter().toLowerCase();
      return entities().filter((p) => p.name.toLowerCase().includes(term));
    }),
  })),
  withMethods((store, api = inject(ProductApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => api.list()),
        tap((products) => patchState(store, setAllEntities(products), { loading: false })),
      ),
    ),
    select(id: number) {
      patchState(store, { selectedId: id });
    },
    setFilter(filter: string) {
      patchState(store, { filter });
    },
    add(product: Product) {
      patchState(store, addEntity(product));
    },
    updatePrice(id: number, price: number) {
      patchState(store, updateEntity({ id, changes: { price } }));
    },
    remove(id: number) {
      patchState(store, removeEntity(id), store.selectedId() === id ? { selectedId: null } : {});
    },
  })),
);
