# L3 - Shop: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `ShopService` is a god service: catalog search, cart, wishlist, notifications, orders and formatting in one class, one file, one reason to change per team. | **blocking** for the refactor, should-fix as a review comment on a small PR |
| 2 | Folders by kind (`services`, `components`, `models`, `utils`): you cannot see what the application does, and nothing prevents any file from importing any other. | should-fix |
| 3 | Every component injects the whole service: tests need all of its state, and an extraction (the wishlist spike) cannot tell what it depends on. | should-fix |
| 4 | No public API: all files are importable from anywhere, so every file is API. | should-fix |
| 5 | The refactor must be behaviour-preserving: the characterization tests (first `describe`) pin the user-visible behaviour before and after. | process |

## ADR-001: Organise the shop by feature, with a public API per feature

**Status:** accepted. **Context:** four teams edit one class; the code layout hides the domain; a lazy-loaded wishlist could not be extracted.

**Decision.**

```
shop-demo.ts                     composition root (may import every feature)
notifications/  store, bar, index.ts          depends on: nothing
cart/           store, panel, index.ts        depends on: notifications
wishlist/       store, panel, index.ts        depends on: notifications
catalog/        store, product-card, index.ts depends on: cart, wishlist
orders/         store, panel, index.ts        depends on: cart, notifications
shared/         money.ts                      depends on: nothing
```

**Rules** (checked by `shop.spec.ts`): features import each other only through `index.ts`; `shared` imports no feature; no cycles;
no file over 60 lines; no top-level folder named after a kind of file.

**Consequences.** A change to the wishlist touches `wishlist/` only; teams own folders; any feature can be moved to a lazy route or a library
by following its arrows; tests construct one small store. Costs: more files and indexes, a migration to schedule, and a barrel-file discipline.

**Alternatives considered.**
1. *Keep one service and split the file by region:* removes merge conflicts, keeps coupling. Rejected.
2. *Domain-driven bounded contexts with events between them* (notifications as an event bus): decouples further, but is more machinery than a
   shop of this size needs. A reasonable next step if `notifications` keeps collecting dependents.
3. *`notifications` as a cross-cutting `shared` service:* simpler arrows, but `shared` must stay free of feature knowledge, and notifications
   know about "cart" messages. Kept as a feature for now.
4. *Merge `orders` into `cart`:* fewer arrows; rejected because `orders` will grow (history, payment) and `cart` must not depend on it.

**How to migrate safely.** (1) Write characterization tests against the UI (done). (2) Extract one feature at a time, leaving the old
service delegating to the new store, commit by commit. (3) Delete the facade last. (4) Add the fitness spec as the guard rail. (5) Only then move
code between teams.

## Why these rules (and where they would hurt)

- **Small files** are a proxy: the real goal is "one reason to change". A line count catches the god service cheaply but would also
  reject a legitimately long file, so use it as a smoke alarm and read the exceptions.
- **Dependencies pointing one way** is what makes extraction possible. `orders -> cart` is fine; `cart -> orders` would make a cycle.
- **Presentational vs. container** still applies inside a feature (see L1); the stores here are the containers' state.

## The fix

See the folder tree above. No behaviour changed; `shop.spec.ts` is green before and after.

## What the tests can and cannot prove

The first block proves that the user sees the same thing. The second block checks structure with the import scanner (`src/app/core/architecture-rules.ts`).
Neither can say whether the decomposition is right for the product; that is the ADR's job.

## What a reviewer should say in the PR comment

> **Should-fix (for the next PR):** `ShopService` has five unrelated responsibilities and the tree is organised by file type. Propose
> `catalog/cart/wishlist/notifications/orders` features with `index.ts`, one-way dependencies, and a fitness test; migrate one feature per PR
> behind the existing behaviour tests. I would not block this PR on it, but I would block adding a sixth responsibility to the class.
