# L3 - Article page (incremental hydration)

**Reported by:** Web performance team and QA  |  **Area:** Article page, server-side rendering  |  **Priority:** High

## What we see

1. On the article page the "Like" button does nothing when you click it, no matter how long you wait. The same
   button works on the plain client-side build.
2. The comments list was reported as "flashing": it appears from the server, disappears and appears again a moment later
   when the page becomes interactive. Developers say they "fixed the console errors" about the comments, but a
   performance trace shows the whole comments subtree is created again in the browser.
3. The relative times ("42 min ago") of the comments are different in the server HTML than in the page a second later.

## Expected

The Like button works (the first click is not lost), the comments are reused from the server HTML without being created
again, and the first render in the browser matches what the server sent.
