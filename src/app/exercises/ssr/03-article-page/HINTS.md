# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Read every attribute and every trigger on the page as a **statement about hydration**: what does each one tell Angular
to do (or not to do) with that part of the DOM?

</details>

<details><summary>Hint 2 - area</summary>

- `@defer (hydrate never)` is a deliberate choice. What does a block that never hydrates keep? What does it never
  get? Which of the two components inside it needs event listeners?
- `ngSkipHydration` tells Angular to give up hydrating a component and everything inside it. Why would a developer add
  it? What was the console error telling them about the **cause**?
- Which of the other `hydrate` triggers fit a button that the reader may want to click right away (`interaction`,
  `viewport`, `idle`, `hover`, `immediate`, `timer`, `when`)? What happens to the click that triggers `interaction`?

</details>

<details><summary>Hint 3 - near the answer</summary>

Use `@defer (hydrate on interaction)` for the reaction bar (incremental hydration includes event replay, so the
first click is replayed after hydration). Remove `ngSkipHydration` from `Comments` and fix the real mismatch: do not
read `Date.now()` during the first render; keep a `now` signal that is `null` until `afterNextRender` sets it, and
render the relative time only when it is known.

</details>

---

Tests won't catch everything: they check the rendered markup and scan the template for the unsafe trigger, but only a
real server render and a trace of the browser show what was or was not hydrated.
