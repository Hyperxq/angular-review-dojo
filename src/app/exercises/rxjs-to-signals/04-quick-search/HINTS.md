# S4 - Hints

<details><summary>Hint 1 - nudge</summary>

This code was already converted to signals. Ask whether "a value that changes" is really the whole
problem here, or whether something about *time* and *concurrent requests* is involved.

</details>

<details><summary>Hint 2 - area</summary>

An `effect` re-runs on every change of `term` and starts a request each time, writing into another
signal from a callback. What is the delay between keystroke and request? What cancels a request
that is no longer wanted? In which order do responses arrive?

</details>

<details><summary>Hint 3 - near the answer</summary>

Bring the stream back where it belongs: `toObservable(this.term)` then `debounceTime`, `map(trim)`,
`distinctUntilChanged`, `switchMap` (return an empty list for short terms), and `toSignal` to get
back to the template. An `rxResource` whose `stream` waits with `timer(300)` before calling the API
is an equivalent alternative.

</details>
