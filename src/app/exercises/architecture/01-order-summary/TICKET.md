# L1 - Order summary

**Reported by:** Finance and the Frontend guild  |  **Area:** Checkout, order summary  |  **Priority:** Medium

## What we see

1. Finance found a mismatch: the order summary shows $605.00 for an order of exactly $500.00, but the invoice (generated
   with the shared pricing rules) says $544.50, because orders of **$500 or more** get the 10% volume discount.
2. A developer who wanted to show the summary in the storybook / in a unit test could not render it without setting up
   the HTTP client and the whole fake API, although the component "only" shows the lines it is given.
3. The same page makes the stock request from two places depending on where you look. Nobody knows who owns the data.

## Expected

The summary shows exactly the amounts of the pricing rules, can be rendered from its inputs alone, and the page that
uses it owns where the data comes from.
