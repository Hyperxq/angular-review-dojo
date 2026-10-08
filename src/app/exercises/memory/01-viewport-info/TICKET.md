# L1 - Viewport info

**Reported by:** Performance team  |  **Area:** Diagnostics panel  |  **Priority:** Medium

## What we see

After opening and closing the diagnostics panel a few dozen times during a long support session, the browser tab
gets sluggish. In DevTools' Performance monitor the **JS event listeners** counter climbs by two on every visit and
never goes down, and a Performance recording shows the clock callback firing once a second *per visit*, even
though the panel is closed.

## Expected

Leaving the panel leaves nothing behind: the number of listeners and timers is the same before the first visit and
after the hundredth.
