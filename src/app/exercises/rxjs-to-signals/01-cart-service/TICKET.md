# S1 - Cart service

**Reported by:** QA  |  **Area:** Cart  |  **Priority:** High

## What we see

- Adding a product to the cart increases the number next to "Cart" in the header and updates the
  total, but the list of lines under it stays empty (or shows the old quantity).
- Adding a product that is already in the cart: same thing, count and total move, the line does
  not.
- Removing a line makes the list correct again for a moment, then it goes out of sync again with
  the next addition.

## Expected

The list, the count and the total always describe the same cart.
