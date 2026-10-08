# L3 - Cart suite (a bug shipped although CI was green)

**Reported by:** Support + the on-call engineer  |  **Area:** Cart  |  **Priority:** High

## What we see

1. Adding the same product twice shows two separate lines in the cart instead of one line with quantity 2.
2. Some carts show totals such as `$30.30` on screen but charge `30.299999999999997` units to the payment
   provider, which then rejects the amount as malformed.
3. The cart test suite is "flaky": a developer who ran only the test called *"adding the same product
   again increases the quantity"* (to debug something else) saw it fail, and the same suite sometimes
   fails on the slower CI machine with an empty `localStorage`.

## Expected

The cart behaves as described above. The suite must be trustworthy: every test passes when run alone, in any
order, on any machine, and it tests what the cart does, not how it is written inside.
