# L3 - Product spotlight

**Reported by:** Marketing  |  **Area:** Home page spotlight  |  **Priority:** High

## What we see

1. The "Free shipping" banner is supposed to disappear after 3 seconds. It never does.
2. When I switch my laptop to airplane mode, nothing happens. The "You are offline" notice
   only shows up if I happen to click something afterwards. Same when I come back online: the notice
   stays on screen.
3. Lighthouse flags the big spotlight picture as the Largest Contentful Paint element and
   says it is not prioritised and has no `fetchpriority`.
4. Analytics shows a `spotlight_view` event every time somebody clicks "Add to cart", so our
   product-view numbers are inflated by add-to-cart clicks. It should only fire when the spotlight
   shows a different product.

## Expected

The banner goes away on time, the offline notice follows the browser state immediately, the hero
image is loaded as the high-priority image it is, and a view is only reported when the product changes.
