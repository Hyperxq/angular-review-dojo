# L6 - Product browser

**Reported by:** QA  |  **Area:** Catalog  |  **Priority:** High

## What we see

- Switching quickly between categories sometimes leaves the list showing products from the
  previous category.
- Clicking "Compare prices" does nothing: no table appears. The browser console shows a red error
  each time it is clicked.
- Clicking "Notify me when restocked" greys the button out, but we never get any notification when
  a product comes back in stock. The console shows a red error when the button is clicked.

## Expected

The list matches the category, "Compare prices" shows the products sorted by price, and the notify
button announces restocks.
