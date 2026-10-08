# L1 - Stock badge (a bug shipped although CI was green)

**Reported by:** Support  |  **Area:** Product cards and the low-stock dashboard  |  **Priority:** High

## What we see

Last week's release went out with a green CI run, and two things are wrong in production:

1. A product with **0** units on the shelf shows the badge "Low stock" instead of "Out of stock",
   and customers keep ordering it.
2. The low-stock dashboard misses products that have **exactly 5** units left, and keeps listing
   products that have already been restocked.

The team says "the component and the store both have tests". Run `npm test` and look at the
`audit` spec: it describes what the product team actually asked for.

## Expected

CI should have gone red. The existing tests must really protect these behaviours, and the code must do
what the product team asked for.
