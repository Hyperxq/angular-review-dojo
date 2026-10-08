# L4 - Hints

<details><summary>Hint 1 - nudge</summary>

What happens to a stream after an error has travelled all the way to a `catchError` that replaces
it? Is the thing that was producing the tab clicks still subscribed?

</details>

<details><summary>Hint 2 - area</summary>

Look at where `retry` and `catchError` sit relative to `switchMap`. They are applied to the outer
stream (the category selection), not to the request. Also look at how long `retry(3)` waits before
trying again.

</details>

<details><summary>Hint 3 - near the answer</summary>

Move error handling inside the `switchMap` projection, on the HTTP observable, so an error only
ends that one request. Use `retry({ count: 3, delay: (error, attempt) => timer(...) })` for an
exponential backoff, then `catchError` to turn the final error into a view state.

</details>
