# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Follow a failure from the HTTP call to the human: at each step, is the error propagated, transformed, shown or discarded?

</details>

<details><summary>Hint 2 - area</summary>

- What does `catchError(() => of([]))` turn a failed request into? Can the template tell the difference between that and a
  real empty answer?
- A resource has a `status`, an `error()` signal and a `reload()` method. Which of them would the UI need to show the failure
  and offer a retry?
- Angular sends unhandled errors to the `ErrorHandler` token. What does the custom handler do with the error apart from
  printing it? Which service exists to forward it?

</details>

<details><summary>Hint 3 - near the answer</summary>

Drop the `catchError` from the resource's stream. In the template check `products.error()` first and show a
`role="alert"` message with a "Try again" button that calls `products.reload()`. In `AppErrorHandler` inject the
`ErrorReporter` (it is created through `inject()`, so use a field initializer) and call `report(error)` as well as
`console.error`.

</details>

---

Tests won't catch the product questions: should the message differ between "offline" and "server error"? Should a failed
reload keep showing the previous list (stale-while-error)? They are discussed in `SOLUTION.md`.
