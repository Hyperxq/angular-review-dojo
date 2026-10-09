# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Read `shop.service.ts` once and underline the section comments: `// catalog`, `// cart`, `// wishlist`, `// notifications`,
`// orders`. Each one is a candidate for a folder (a feature) with its own state.

</details>

<details><summary>Hint 2 - area</summary>

- A feature folder contains everything that feature needs (state, components) and an `index.ts` that names what others may use.
- Who needs whom? Adding to the cart shows a notification; placing an order empties the cart and shows a notification. Draw the arrows.
  Which feature is at the bottom (needs nobody)? Is there an arrow in both directions anywhere?
- The wishlist stores `Product` objects, not ids: why does that keep `wishlist` from depending on `catalog`?
- `shared/` is for small things with no knowledge of any feature (`formatPrice`).

</details>

<details><summary>Hint 3 - near the answer</summary>

Target structure (each store is a small `@Service()` class):

```
shop-demo.ts                      composition root, may import every feature
notifications/  notifications-store.ts  notifications-bar.ts  index.ts
cart/           cart-store.ts  cart-panel.ts  index.ts            (uses notifications)
wishlist/       wishlist-store.ts  wishlist-panel.ts  index.ts    (uses notifications)
catalog/        catalog-store.ts  product-card.ts  index.ts       (uses cart, wishlist)
orders/         orders-store.ts  index.ts                         (uses cart, notifications)
shared/         money.ts
```
Every import from another feature goes through its `index.ts`. Delete `services/`, `components/`, `models/`, `utils/`.

</details>

---

Tests won't catch whether this is the *right* decomposition (is `orders` a feature or part of `cart`? should `notifications`
be a cross-cutting `shared` service?). The ADR in `SOLUTION.md` records the choice and the alternatives.
