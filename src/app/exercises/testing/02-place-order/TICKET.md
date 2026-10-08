# L2 - Place order (a bug shipped although CI was green)

**Reported by:** Finance  |  **Area:** Checkout  |  **Priority:** Critical

## What we see

Several customers have been charged twice for the same cart. Looking at the order log, the "duplicates"
are created within a second of each other, always after a slow day for the payment provider (it answered
`500` the first time). The customer saw a single "We could not place your order" message.

The checkout team insists the order button is covered by tests and CI was green for the release. The
`audit` spec describes the payments rule.

## Expected

An order is sent once. CI should fail for a change like the one that introduced this, and the tests of
this feature should be trustworthy: they should check the real HTTP traffic, describe the page the way a
user sees it, and not interfere with other tests.
