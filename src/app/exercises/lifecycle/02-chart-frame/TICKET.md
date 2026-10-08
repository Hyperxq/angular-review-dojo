# L2 - Chart frame

**Reported by:** Accessibility review + QA  |  **Area:** Chart frame  |  **Priority:** Medium

## What we see

1. The legend should be announced by screen readers when it changes (`aria-live="polite"`), but the attribute is
   missing on the legend.
2. The "Width: N px" line under the chart shows `0px` until I interact with the page (click anything), and
   the axis ticks are computed for width 0 until then.
3. The profiler shows the tick calculator being called on every single change detection pass, including passes
   triggered by hovering unrelated buttons elsewhere on the page.
4. The server-rendered build of the page (we are evaluating SSR) logs an error from this component: it touches
   the DOM while the page is being rendered on the server.

## Expected

The legend is announced, the width and ticks are correct as soon as the chart is shown, the tick
calculation only runs when the width changes, and the component does not touch the DOM on the server.
