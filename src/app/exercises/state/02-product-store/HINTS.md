# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

List every fact the store keeps. For each one ask: is it stored twice (a copy of a product in `selected`, a filtered copy
in `visible`)? Who writes it, and how?

</details>

<details><summary>Hint 2 - area</summary>

- `patchState` compares each top-level slice by **reference** (`!==`) before notifying. What does that mean for a callback
  that pushes into the existing array and returns the same state?
- `selected` holds an object that also lives in `products`. After `updatePrice` replaces the object in the array, which
  copy does `selected` still point to? What could `selected` hold instead of the object?
- `visible` is state that a hook re-computes in an `effect`. When do effects run relative to the line that changed the
  filter? Which API gives you a value that is always current and needs no hook?
- `@ngrx/signals/entities` provides `withEntities`, `addEntity`, `updateEntity`, `removeEntity`, `setAllEntities` and an
  `entityMap` signal: what does a normalized collection buy you?

</details>

<details><summary>Hint 3 - near the answer</summary>

Keep a single normalized collection with `withEntities<Product>()` and store `selectedId` (a number) instead of the
object. Define `selected`, `visible`, `count` and `inventoryValue` in `withComputed`. Write with
`patchState(store, addEntity(product))`, `updateEntity({ id, changes: { price } })`, `removeEntity(id)` and
`setAllEntities(products)`; `remove` should also clear `selectedId` when it matches. Delete the `effect` hook.

</details>

---

Tests won't catch the architecture-level findings: business rules that belong in the store but live in a component
(for example pricing or discount rules), and whether this store should be `providedIn: 'root'` or provided by the feature
route (see L3). They are listed in `SOLUTION.md`.
