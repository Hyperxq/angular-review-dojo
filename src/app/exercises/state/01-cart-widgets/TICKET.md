# L1 - Cart widgets

**Reported by:** QA  |  **Area:** Cart header and cart list  |  **Priority:** High

## What we see

1. The "Cart (n)" counter in the header stays at 0 when products are added to the cart; it only shows the right number
   after reloading the page.
2. After removing a product from the cart list the "Total" in the header still includes it. Add two products, remove one:
   the total keeps showing the sum of both.
3. A developer on the checkout team set the cart total from a component to "fix a rounding display" and broke the totals
   on every other page. Nothing in the code prevents it.

## Expected

Counter and total always reflect the cart items. Only the cart service decides how the cart changes.
