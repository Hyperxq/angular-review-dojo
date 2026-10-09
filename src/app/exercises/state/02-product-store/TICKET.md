# L2 - Product admin store

**Reported by:** Back-office team and QA  |  **Area:** Product administration  |  **Priority:** High

## What we see

1. Adding a product (from the import tool) does not change the "n products" counter, and the product only shows up in the
   list after the next reload.
2. Typing in the filter box works, but code that reads the filtered list right after changing the filter sometimes sees
   the previous result (a unit test of the import tool had to add an arbitrary wait to get the right list).
3. Select a product, change its price in the detail panel and press Save: the list shows the new price, the detail panel
   keeps showing the old one.
4. Delete the selected product: its detail panel stays on screen.

## Expected

Every view of the products (list, counter, filter result, detail panel) always agrees, immediately.
