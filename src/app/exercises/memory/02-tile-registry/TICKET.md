# L2 - Tile registry

**Reported by:** Performance team  |  **Area:** Catalog tiles and search preview  |  **Priority:** Medium

## What we see

1. After hiding and showing the catalog tiles a few times, the heap snapshot comparison shows the number of
   `ProductTile` instances growing by 12 on every cycle, with the retainer path going through `TileRegistry`. "Highlight
   keyboards" also keeps writing to tiles that are no longer on the page.
2. During a long search session, memory climbs steadily. The heap snapshot shows thousands of `HTMLElement`s in the
   **Detached** list, retained by `PreviewCache`, one per distinct search term typed so far.

## Expected

Memory is flat across any number of show/hide cycles and any number of distinct searches; the registry
only knows about tiles that are on the screen, and the cache has a size limit and stores data, not DOM elements.
