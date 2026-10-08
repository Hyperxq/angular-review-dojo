# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Search and save are both "inner request per outer event", but they want opposite answers to "what
should happen to the previous request when a new event arrives?".

</details>

<details><summary>Hint 2 - area</summary>

- Search pipeline: which operators belong between `valueChanges` and the HTTP call so that you do
  not search on every key and do not repeat the same term? What does `mergeMap` do with an older
  response that arrives late?
- Save pipeline: what does `switchMap` do to an in-flight `PUT` when a second click arrives, and is
  that acceptable for a write?

</details>

<details><summary>Hint 3 - near the answer</summary>

Search: `debounceTime(300)`, `distinctUntilChanged()`, then `switchMap` (only the latest term
matters, drop the rest). Save: `exhaustMap` (ignore clicks while a save is in flight; `concatMap`
would queue them instead). Pick the one that matches the business rule and explain why.

</details>
