# L3 - Reports area (lazy feature)

**Reported by:** Finance team and Platform team  |  **Area:** Lazy-loaded reports area  |  **Priority:** High

## What we see

1. After the reports area was moved to its own lazy-loaded bundle, requests made from it stopped carrying the trace header
   that every other request has, and in the local environment they no longer reach the fake backend at all (they go to the
   dev server and come back as 404). The platform team's request logging sees nothing from this area.
2. Exports from the reports page are missing from the audit trail shown on the area's header; the compliance export
   reads the application-wide audit log and finds no entries for this area.
3. Selecting reports on the page does not change the "n selected" badge in the area's header.

## Expected

The lazy area behaves like part of the application: its requests go through the application's HTTP setup (plus the area's own
interceptor), it writes to the application's audit log, and its page shares the selection with the header badge.
