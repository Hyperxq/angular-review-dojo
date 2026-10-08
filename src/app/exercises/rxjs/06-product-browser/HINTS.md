# L6 - Hints

<details><summary>Hint 1 - nudge</summary>

Read the console errors literally. Some Angular APIs only work at specific moments (while a
component is being constructed). When is a click handler running?

</details>

<details><summary>Hint 2 - area</summary>

- The category list: an `effect` fetches data and pushes it through a `Subject` into `toSignal`.
  Is an `effect` the right place to start requests, and what cancels the previous one?
- `compare()` and `watchRestocks()` call `toSignal` / `takeUntilDestroyed()` from methods. Both
  need an injection context, or an explicit `DestroyRef` / `Injector`.

</details>

<details><summary>Hint 3 - near the answer</summary>

Derive the list with `rxResource({ params: () => this.category(), stream: ... })`. For the
comparison, keep a `comparing` signal and a second resource whose `params` is `undefined` until
the button is clicked. For the feed, inject `DestroyRef` as a field and pass it to
`takeUntilDestroyed(destroyRef)`.

</details>
