# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Three independent problems. Read `GUIDE.md` in this folder's parent for how to *see* each one in Chrome DevTools, then
look for: something created in an `effect` that nobody destroys, a function called from a template that does a lot
of work, and a loop that mixes writes and reads of layout properties.

</details>

<details><summary>Hint 2 - area</summary>

- `effect` re-runs whenever a signal it reads changes. What does the third-party `init()` do each time? What do
  `onCleanup` and `DestroyRef` offer? Is there a lifecycle step that should happen once?
- A template method runs on every refresh of the view. A `computed` re-runs when its dependencies change. Which
  signals does `stats` depend on?
- `offsetHeight` forces the browser to apply pending style writes and compute layout before answering. What
  happens when a write follows each read? Angular offers render hooks with explicit phases (`earlyRead`, `write`,
  `mixedReadWrite`, `read`) so reads and writes are batched.

</details>

<details><summary>Hint 3 - near the answer</summary>

Create the chart once (`afterNextRender` or the constructor + `viewChild`) and register `chart.destroy()` with
`inject(DestroyRef).onDestroy(...)`. Use an `effect` only to call `chart.update(series())`. Make `stats` a
`computed(() => this.statsService.compute(this.series()))`. Measure the cards in `afterNextRender({ read: ... })`
(no writes in between) and apply the height through a signal bound with `[style.height.px]`.

</details>
