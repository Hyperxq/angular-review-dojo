# L1 - Tooltip and highlight

**Reported by:** QA + Security  |  **Area:** Product actions toolbar  |  **Priority:** High

## What we see

1. Hovering "Save" shows a tooltip with the word "all" in bold: the tooltip text is rendered as markup.
   Security notes that the text comes from the product data in other screens and that a title such as
   `<img src=x onerror=alert(1)>` runs a script when hovered.
2. After opening and leaving the toolbar page a few times, pressing Escape anywhere in the app does
   noticeable work: the browser's Performance tab shows the same keydown handler registered many times
   (one more each visit).
3. If the toolbar page is closed (route change) while a tooltip is open, the tooltip stays
   stuck on the screen for good.
4. The "Toggle highlight colour" button changes the colour the toolbar thinks it has, but the
   "Save" button background never changes.

## Expected

Tooltips show plain text only, they clean up after themselves when the directive goes away, and the
highlight follows its colour input.
