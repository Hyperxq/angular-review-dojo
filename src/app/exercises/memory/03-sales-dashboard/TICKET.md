# L3 - Sales dashboard

**Reported by:** Performance team + Support  |  **Area:** Sales dashboard  |  **Priority:** High

## What we see

1. Every time the "New data" button is pressed the chart redraws twice as fast as before and the page gets
   heavier. Hiding and showing the dashboard repeatedly leaves the browser busy even when the dashboard is hidden: the
   Performance monitor shows **JS event listeners** going up with every refresh and the profiler shows several
   `requestAnimationFrame` loops running at once.
2. Typing in "Filter regions" is laggy on a 400-point series. A Performance recording shows a long task (well over
   50 ms) on every keystroke, with the same statistics being recalculated although the data did not change.
3. Opening the dashboard shows a long task and many purple **Layout** bars in the main thread during the card
   height alignment: the browser is forced to recalculate layout once per card.

## Expected

One chart per dashboard, destroyed with it and updated (not recreated) on new data; statistics are calculated when the
data changes, not when someone types; card heights are aligned with at most one layout calculation.
