# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Hydration compares the DOM the server produced with what the browser's first render would produce. List everything
in this feature that could produce a **different** result on the second render, or whose result the HTML parser would
reshape on the way from server to browser.

</details>

<details><summary>Hint 2 - area</summary>

- What do `new Date()` and `Math.random()` return on the server vs. in the browser a second later? Where in Angular can
  you run code that exists only in the browser?
- Serialize the server DOM to a string and parse it again: do you get the same tree back? Which element does the HTML
  parser insert between `<table>` and `<tr>`?
- A component that edits its own host with `insertAdjacentHTML` in `ngOnInit` changed the DOM behind Angular's back.
  Where should that markup come from?
- `provideClientHydration(...)` takes feature functions. Which one is turned on by default for HTTP, and which line
  turned it off?

</details>

<details><summary>Hint 3 - near the answer</summary>

Make the first render deterministic: `now = signal<Date | null>(null)` and `featuredIndex = signal(0)`, both set inside
`afterNextRender`. Wrap the rows in `<tbody>`. Put the "New" badge in the banner's template. Replace
`withNoHttpTransferCache()` with plain `provideClientHydration()` (the transfer cache is on by default; use
`withHttpTransferCacheOptions(...)` only to customize it).

</details>

---

Tests won't catch every item here: a component editing its own DOM in `ngOnInit` (the promo banner) renders fine in
jsdom and only fails in a real hydration. Finding it is the point.
