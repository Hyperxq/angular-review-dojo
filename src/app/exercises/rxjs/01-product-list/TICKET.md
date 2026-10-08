# L1 - Product list

**Reported by:** QA  |  **Area:** Catalog  |  **Priority:** Medium

## What we see

1. Opening the Products page shows "Loading products…" and it stays that way, even though the
   Network tab shows the products request finished. As soon as I click anywhere on the page the
   list appears.
2. After switching between Home and Products a few times, a single stock update in the backend
   makes the console print "Stock changed, reloading products" several times, and the Network tab
   shows several identical product requests fired at once. The more I navigate, the worse it gets.

## Expected

The list renders as soon as the data arrives, and one stock update causes one reload, no matter how
many times I visited the page before.
