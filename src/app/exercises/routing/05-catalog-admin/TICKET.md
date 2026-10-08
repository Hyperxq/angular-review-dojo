# L5 - Catalog admin

**Reported by:** Back-office team  |  **Area:** Admin / product editor  |  **Priority:** High

## What we see

1. In the product editor I type a product name on the General tab, switch to Pricing and the page
   says "Pricing for a new product". Going back to General, the name field is empty again. The
   name only survives if I never change tabs.
2. Leaving the editor (for example to the Dashboard) always asks "You have unsaved changes. Leave
   anyway?", even when I have not typed anything or have just pressed Save.
3. The "Help" link in the top bar changes the address bar to include `(aside:help)` but the help
   panel never appears.
4. The browser tab title is "undefined | Admin" on the Dashboard. The editor tabs look right
   ("General | Admin", "Pricing | Admin").

## Expected

The draft is shared by both tabs, the confirmation only appears when there really are unsaved
changes, Help opens in the side panel and every page has a proper tab title.
