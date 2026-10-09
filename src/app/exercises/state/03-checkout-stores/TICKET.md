# L3 - Checkout stores

**Reported by:** Support and QA  |  **Area:** Add to cart, stock display  |  **Priority:** Critical

## What we see

1. When a product runs out, "Add to cart" shows the item in the cart straight away (that is the intent: instant feedback),
   but when the server then answers "sold out" the stock goes back up while the cart **keeps the item**. The customer
   checks out an item that does not exist.
2. A customer on a busy day clicked "Add to cart" on two different keyboards a split second apart. One request failed. After
   the failure, the **other** keyboard's stock number jumped back up, although its reservation had succeeded; the
   page then offered units that were already reserved.
3. In the shared kiosk at the shop, Ana added a mouse to her cart and signed out. Marcus signed in and found the mouse in
   his cart. Worse: a late failure for Ana's request removed Marcus's own mouse.

## Expected

An optimistic update is undone precisely (only the change that failed, in every place it touched). Concurrent
requests do not interfere. A cart belongs to the person who is signed in.
