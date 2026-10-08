# L2 - Product pages

**Reported by:** Support  |  **Area:** Product detail  |  **Priority:** High

## What we see

1. On a product page, clicking "Next product" changes the URL but the page keeps showing the
   previous product's name, price and stock. A browser refresh shows the right product.
2. Switching between the "Details" and "Stock" tabs changes the URL (`?tab=stock`) but the content
   below does not change. Reloading the page with `?tab=stock` in the URL does show the stock tab.
3. Following a link to a product that does not exist (for example `/products/99`) does nothing:
   the click is ignored and the previous page stays on screen. There is an error in the console.

## Expected

The page always reflects the URL: product, tab and all. A product that does not exist takes the
user to a friendly "could not find that product" page.
