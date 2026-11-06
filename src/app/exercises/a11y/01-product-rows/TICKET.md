# L1 - Product rows (accessibility audit)

**Reported by:** Accessibility audit (keyboard and screen reader testing)  |  **Area:** Product list  |  **Priority:** High

## What we see

1. With only the keyboard, Tab skips the product names: there is no way to select a product. A screen reader reads
   the names as plain text and never says that they can be activated.
2. The heart and cross buttons are announced as "button" followed by nothing useful (or "white heart suit",
   "multiplication x"). Nobody can tell which product they act on.
3. The search box has no label, only a placeholder that disappears once you type, and the quantity boxes are announced
   as "spin button" with no name at all.
4. When tabbing through the page it is impossible to see where the focus is.

## Expected

Everything that can be used with a mouse can be used with the keyboard and is announced with a meaningful name and
role; the keyboard focus is always visible.
