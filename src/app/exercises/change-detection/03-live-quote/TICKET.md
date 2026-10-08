# L3 - Live quote (zoneless migration)

**Reported by:** Trading desk  |  **Area:** Live quote widget  |  **Priority:** Critical

## What we see

We removed zone.js from the app last sprint. The quote widget has been broken since:

1. The price, the spread and the history stay empty. Clicking elsewhere on the page makes them appear, and they
   then freeze again until the next click.
2. The "connecting" label never changes to "live", although it is supposed to after 300 ms.
3. Navigating away from the widget and back a few times makes the browser's memory grow: a heap snapshot
   still contains the old widget instances, and they keep receiving every message of the feed.
4. Code review says the component is "full of workarounds that are no longer needed" (zone calls, a
   forced strategy, work in a check hook), but nobody dares to remove them.

## Expected

The widget follows the feed by itself, cleans up after itself, and has no leftovers from the zone.js era.
