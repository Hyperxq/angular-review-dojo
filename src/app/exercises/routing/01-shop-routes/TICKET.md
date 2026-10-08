# L1 - Shop routes

**Reported by:** QA  |  **Area:** Storefront navigation  |  **Priority:** High

## What we see

1. Clicking "Checkout" or "Account" in the top navigation shows "Page not found", even though
   both pages exist and worked in the last release.
2. In the product list, the "Add a product" link opens a page titled with the product
   "Product not found" instead of the new-product form.
3. Opening `/checkout` from a bookmark with an empty cart leaves the user on a blank screen with
   no explanation. Customers think the site is broken.

## Expected

Every page in the navigation opens. "Add a product" opens the new-product form. Trying to check out
with an empty cart sends the user back to the product list.
