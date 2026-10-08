# L2 - Order summary

**Reported by:** QA  |  **Area:** New order page  |  **Priority:** High

## What we see

1. Clicking "Add next product" adds the product to the list on the left, but the summary
   ("N items", subtotal, tax, total) does not change. It only catches up when something else forces
   the page to refresh.
2. On large orders the page gets laggy while typing elsewhere on the page. The profiler shows the
   subtotal being calculated many times for every refresh of the summary.

## Expected

The summary always matches the lines on the page, and the totals are calculated once per change.
