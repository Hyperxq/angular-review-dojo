# L1 - Cart widgets: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `total` and `count` are writable signals updated by hand next to `items`; `remove()` forgot them, so they drift. | **blocking** |
| 2 | `CartBadge` copies the count into a local signal once (a snapshot, not a view): it never updates. | **blocking** |
| 3 | `items`, `total` and `count` are public writable signals on a root service: any component can `set()` them. | should-fix |
| 4 | The cart service is `providedIn: 'root'` with no persistence: fine here, but a reload loses the cart (product decision). | question |

## Why

One source of truth, everything else derived. Whenever the same fact is stored twice, every writer must update both, and the
next developer will miss one. `computed` makes the derivation declarative, lazy and memoized. A signal read **inside** a
field initializer is read once: `signal(cart.count())` copies a number; `cart.count()` in the template is a live
dependency. And a service that exposes `signal(...)` publicly hands out write access along with read access; expose
`asReadonly()` (or a `computed`) and give the service methods that express *intent* (`add`, `remove`), so the invariants
live in one place.

## The fix

```ts
private readonly _items = signal<CartItem[]>([]);
readonly items = this._items.asReadonly();
readonly count = computed(() => this._items().reduce((n, i) => n + i.quantity, 0));
readonly total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));
```
and `CartBadge` renders `cart.count()`.

## Tradeoffs and discussion

- **Methods vs. exposing a writable signal:** methods cost a line each but centralize rules (stock limits, analytics).
  Exposing `.update` makes the service a bag of variables.
- **Service vs. store:** this is the point where a SignalStore starts paying off (L2): state, computed and methods in one
  declaration, with `patchState` as the only write path.

## What a reviewer should say in the PR comment

> **Blocking:** `total` and `count` are stored and manually kept in sync; `remove()` doesn't touch them. Derive them with
> `computed` from `items`. **Blocking:** `CartBadge` snapshots the count in a field initializer, so it never updates; read
> the signal in the template. *Should-fix:* expose `items.asReadonly()` and keep writes inside the service.
