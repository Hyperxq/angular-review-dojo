# L5 - Catalog stats

**Reported by:** QA + Platform  |  **Area:** Catalog overview  |  **Priority:** High

## What we see

- Opening the overview page triggers the products request three times (Network tab).
- Selecting a product on the overview and then opening the detail panel somewhere else on the page
  sometimes shows an empty panel, as if nothing were selected. Selecting again fixes it.
- Platform noticed that the "live price" requests for a product keep arriving every 30 seconds for
  products nobody is looking at anymore, long after the user left the page, and the traffic never
  goes down during a long session. Opening the same product again also briefly shows an old price.

## Expected

One request per piece of data, a panel that always reflects the current selection, and no traffic
for things nobody is watching.
