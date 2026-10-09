# L2 - Product admin store: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `add` mutates `state.products` and returns the same state: `patchState` compares slices by reference, so nothing is notified (counter, list, computed values stay stale). | **blocking** |
| 2 | `selected` is a copy of an entity: after `updatePrice` replaces the object in `products`, the detail panel keeps the old one. The same copy outlives `remove`. | **blocking** |
| 3 | `visible` is derived state written by an `effect` hook: it lags behind the change that caused it (effects are scheduled, not synchronous) and costs a whole extra state write. | **blocking** |
| 4 | A plain array of products needs O(n) scans for every lookup and forces each writer to know the array's shape. | should-fix |
| 5 | `inventoryValue` and similar rules live in the store here, but anything like pricing/discount rules found in components belongs next to them. | should-fix |
| 6 | `{ providedIn: 'root' }` makes the store live for the whole session even though it serves one admin page (see L3 on scope). | question |

## Why

- **`patchState` is shallow:** for every key of the new state, it compares `currentState[key] !== newState[key]` and sets that
  slice signal only when the reference changed (verified in `@ngrx/signals` 22.0.1). Updaters must return **new** values;
  mutation is invisible to signals because nothing notifies.
- **Store ids, derive objects:** keep one normalized collection and a `selectedId`; `selected` is a `computed` over
  `entityMap()`. There is no copy to go stale and removing the entity makes `selected` `null` (clearing the id too keeps the
  state tidy).
- **`computed` over `effect` for derived state:** a `computed` is lazy, memoized and always consistent at read time; an
  `effect` that writes state is asynchronous, runs once per change batch and invites loops. Reserve `effect` for
  side effects that leave the signal graph (logging, storage, DOM, analytics).
- **Writers:** exactly one way to change each fact. With `withEntities` the only writes are the entity updaters, which are
  immutable by construction.

## The fix (shape)

```ts
signalStore(
  withEntities<Product>(),
  withState({ selectedId: null as number | null, filter: '', loading: false }),
  withComputed(({ entities, entityMap, selectedId, filter }) => ({ selected, visible, count, inventoryValue })),
  withMethods(...patchState(store, addEntity(p)) / updateEntity({ id, changes: { price } }) / removeEntity(id) ...),
);
```

## What the tests can and cannot prove

They check the observable behaviour: derived values right after each mutation, the selection after update/remove, and
the page showing the same price everywhere. They cannot see *where* business rules live (component vs. store) or whether the
scope of the provider is right. Those are review findings.

## Tradeoffs and discussion

- **`withEntities` vs. a hand-written `Record<id, T>`:** entities give you tested updaters and `ids`/`entities`/`entityMap` for
  free, at the price of a convention (every slice is named `entities`, `ids`, `entityMap`; use `entityConfig`/collections for
  more than one).
- **Methods that take ids vs. objects:** ids keep callers from passing stale copies.
- **Store vs. component state:** the filter box could be plain component state if nobody else reads it; putting it in the store
  is justified because `visible` is shared.

## What a reviewer should say in the PR comment

> **Blocking:** `add` mutates `state.products` and returns the same reference; `patchState` compares slices by reference so
> nothing updates. Use `addEntity`. **Blocking:** `selected` is a copy of a product, so it goes stale on update and survives
> removal: keep `selectedId` and compute `selected`. **Blocking:** `visible` is derived state set from an effect, so it lags;
> make it a `computed`. *Should-fix:* normalize with `withEntities`. *Question:* does this store need to be root-scoped?
