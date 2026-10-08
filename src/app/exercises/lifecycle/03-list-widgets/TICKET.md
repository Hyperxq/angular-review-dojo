# L3 - List widgets

**Reported by:** QA + the migration team  |  **Area:** Catalog widgets  |  **Priority:** High

## What we see

The widgets on this page were written on top of a shared base class and then half-migrated to signals.

1. The "mice" category list shows "Loading…" forever, and the network tab shows that its request is never sent.
2. After the "Featured" list is removed from the page (route change), its products request stays subscribed:
   in the heap snapshot the component is still retained by the request's subscription.
3. The stock summary crashes while the page opens (`Cannot read properties of undefined (reading 'total')`). When the
   stock request fails the console shows an "Uncaught (in promise)" error and the summary stays broken.
4. The price editor shows the old price for one extra frame whenever its price changes, and code that reads the draft right
   after the price was set (a form that validates on `ngOnChanges`) sees the old value.
5. The text-fit label shows the width of the *first* label it ever had. When the label changes the width stays the same.

## Expected

All widgets load, clean up, handle failures, and follow their inputs, with no base-class tricks.
