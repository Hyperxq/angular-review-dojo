# L1 - Product grid

**Reported by:** Sales ops  |  **Area:** Quick order page  |  **Priority:** Medium

## What we see

1. On the quick-order table I type a quantity next to the first product, then click "Sort by
   price". The rows reorder, but my quantity stays in the first row, now next to a different
   product. We have shipped wrong orders because of this.
2. Clicking "Refresh stock" makes the "Live stock" list flash and loses the text selection and
   focus inside it, even when the stock numbers did not change.
3. The page feels sluggish: clicking "Refresh stock" or "Sort by price" freezes the UI for a moment,
   and the Performance tab shows the same discount calculation running for every product on every
   click, even on clicks that do not touch prices.

## Expected

Quantities stay with their product, a refresh only touches what changed, and prices are calculated
only when the products change.
