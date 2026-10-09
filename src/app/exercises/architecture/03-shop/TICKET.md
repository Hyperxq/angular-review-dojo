# L3 - Shop (maintainability)

**Reported by:** Engineering manager and the three teams working on the shop  |  **Area:** Whole shop module  |  **Priority:** Medium

## What we see

1. Four teams (catalog, cart, wishlist, orders) change `shop.service.ts` every sprint. Merge conflicts in that one file cost
   a day per sprint, and a change to the wishlist once broke the order history because both share private helpers and
   state in the same class.
2. A new engineer needs a week to find where "adding to the cart" is implemented: the code is organised by *kind of file*
   (`services`, `components`, `models`, `utils`), not by what the shop does.
3. The unit tests for one component need the whole `ShopService` with all its state.
4. Last quarter a spike to extract the wishlist into a separate lazy-loaded area failed: it was impossible to say what it depends on.

## Expected

The shop code is organised by feature (`catalog`, `cart`, `wishlist`, `notifications`, `orders`), each with a small public API,
small files, dependencies pointing in one direction, and **the same behaviour for the user**.
