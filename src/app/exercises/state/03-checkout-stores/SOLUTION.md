# L3 - Checkout stores: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | Rollback restores a **snapshot** of the whole stock map taken before the call: it overwrites every change made between the call and the failure (other products' optimistic updates). | **blocking** |
| 2 | The error path undoes the stock but never the cart: the customer keeps an item the server refused. | **blocking** |
| 3 | `CartStore` is a root singleton holding one `items` map: it belongs to nobody, so it leaks from one user to the next. | **blocking** (privacy / wrong order) |
| 4 | A late failure from a previous session would decrement the *current* user's cart if the cart were reset instead of keyed. | **blocking** (if fixed naively) |
| 5 | The `error` message is global, not tied to the product that failed. | nit |
| 6 | No retry/back-off and no reconciliation with the server after a failure (the stock figure is a guess until the next load). | question |

## Why

- **Undo with inverse operations, not with snapshots:** an optimistic update is a small, composable change (`stock - 1`,
  `quantity + 1`). Its inverse is as small. Snapshots are only correct if nothing else wrote in between, which is exactly
  what concurrency violates. (If you need a snapshot, compare/merge by key instead of replacing the slice.)
- **Undo everywhere the change went:** write the optimistic step and its inverse side by side so the two stay in sync.
- **State has an owner:** a root-scoped store survives sign-out, so either key the state by owner (done here, which also
  makes the owner of a late rollback explicit) or give the store a shorter lifetime (a route-level `providers: [CartStore]`, or a
  store created per session). A `reset-on-logout` hook is the weakest option: it must be called on every exit path and races
  with in-flight requests, as finding 4 shows. Capturing the owner when the request **starts** is what makes the rollback safe.
- **Cross-tab state:** `localStorage` or the server is the only way to share a cart between tabs; a store is per tab. Decide
  where the truth lives before building more optimistic UI.

## The fix

```ts
adjust(productId, delta)                                   // StockStore: one small, invertible write
const owner = ownerOf(session.userId());                   // captured when the request starts
stock.adjust(productId, -1); change(owner, productId, +1);
api.reserve(productId).subscribe({ error: () => { stock.adjust(productId, +1); change(owner, productId, -1); ... } });
```
with `items`/`count` computed from `carts()[ownerOf(session.userId())]`.

## What the tests can and cannot prove

They drive the stores with `HttpTestingController`, controlling the order in which responses arrive, which is exactly what
exposes races deterministically. They cannot show multi-tab behaviour, server reconciliation, or what the user sees while
requests are pending.

## Tradeoffs and discussion

- **Optimistic UI vs. pessimistic:** optimistic feels instant but needs a correct undo and a story for failure messages;
  for "add to cart" the cost is low, for payments it is not worth it.
- **Where to keep per-user state:** keyed state in one store (simple, survives logout/login), route-level provider (state dies
  with the route, simple mental model, but navigation clears it), or the server (source of truth, slower).
- **`rxMethod` with `concatMap`/`mergeMap`** is the next step for reserving: a queue per product avoids parallel reservations
  of the same item.

## What a reviewer should say in the PR comment

> **Blocking:** rolling back by restoring a snapshot of the whole stock map overwrites concurrent optimistic changes; undo with
> the inverse operation. **Blocking:** on error the cart isn't reverted. **Blocking:** the cart is a root singleton, so one
> user's items show up for the next; key it by user (capturing the owner when the request starts) or scope it to the session.
> *Question:* do we need to reload stock after a failure to reconcile, and should the message name the product?
