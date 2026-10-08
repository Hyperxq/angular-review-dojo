# L8 - Hints

<details><summary>Hint 1 - nudge</summary>

There are five independent defects here: state handling, a race between local and remote data,
error handling twice (one per request type), and the lifetime of a long-running stream. Take
them one at a time, starting with whatever a reducer promises about its input.

</details>

<details><summary>Hint 2 - area</summary>

- `reduce()`: what does `scan` assume about the value you return? Who else holds a reference to the
  previous one?
- A stock response describes the server at the moment the request was sent. What if the user
  changed something locally after that moment?
- Two `subscribe()` calls have no error handler. The poll also has no end: nothing stops it and
  nothing looks at the page visibility.

</details>

<details><summary>Hint 3 - near the answer</summary>

Return new objects from the reducer (spread / `map`) and add a `version` that increments on every
local change; tag each poll with the version it started from and drop the response if the state has
moved on. Catch errors inside the inner observables (`catchError(() => EMPTY)` for the poll,
dispatch a rollback action for the reservation). Build the poll from the page visibility
(`fromEvent(document, 'visibilitychange')` -> `switchMap` to `timer` or `EMPTY`) and end it with
`takeUntilDestroyed()`.

</details>
