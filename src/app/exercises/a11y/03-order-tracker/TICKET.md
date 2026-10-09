# L3 - Order tracker (accessibility audit)

**Reported by:** Accessibility audit (screen reader and low-vision testing)  |  **Area:** Order tracker  |  **Priority:** High

## What we see

1. With a screen reader, choosing "Help" in the navigation or opening an order is silent: nothing tells you that the page
   changed. Keyboard focus stays on the link that was activated (or drops to the top of the document), so the next Tab
   starts from the wrong place. The browser tab keeps the title of the first page.
2. Changing the "Status" filter updates the list, but a screen reader announces nothing: users do not know whether the
   filter worked, or how many orders are left.
3. The order status is shown by a green, yellow or red dot next to the order number. Colour-blind users (and anyone in
   high-contrast mode) cannot tell a shipped order from a cancelled one; screen readers do not read the dot at all.

## Expected

After navigating, the new page is announced (title updated, focus moved to the start of the new content). Result
changes are announced politely. Status is available as text, not only as colour.
