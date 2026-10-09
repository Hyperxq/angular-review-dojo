# L2 - News feed (hydration)

**Reported by:** Web performance team  |  **Area:** Deals page, server-side rendering  |  **Priority:** High

## What we see

With server-side rendering and hydration on, the deals page flickers when it loads: the "Updated" time and the featured
deal change a moment after the first paint, and the browser console prints
`NG0500` / `NG0501` mismatch errors ("Expected DOM node did not match the server-rendered DOM") for the deals table and
the promo banner. A page-speed audit also shows the request to `/api/products` twice: the server fetches the list
and the browser fetches it again right after loading, which delays the content by the length of the request.

## Expected

The browser reuses the server-rendered DOM without errors or flicker (the time and the featured deal may update
**after** hydration), and data fetched on the server is not fetched again by the browser.
