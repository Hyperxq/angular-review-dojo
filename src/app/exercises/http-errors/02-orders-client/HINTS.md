# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

`withInterceptors([a, b, c])` runs `a` first on the way out and last on the way back. For each of the three interceptors
write down what it sees: the request before or after the others modified it, one attempt or all attempts.

</details>

<details><summary>Hint 2 - area</summary>

- Where in the list must the **toast** interceptor be to see only the final outcome (after retries have given up)? And
  where must the **retry** be relative to the **auth** interceptor if each attempt should be a fresh request?
- `retry` re-subscribes to the observable it wraps. What does `next(req)` return: a new request each time, or one observable
  that was created once, with the downstream interceptor functions already executed? (Hint: wrap it in `defer(() => next(req))`.)
- Which HTTP methods are safe to repeat? Which status codes are worth repeating?

</details>

<details><summary>Hint 3 - near the answer</summary>

Order: `[errorToastInterceptor, retryInterceptor, authInterceptor]`. In `retryInterceptor` use
`defer(() => next(req)).pipe(retry({ count: 2, delay, ... }))` and give `retry` a conditional: only for `GET`/`HEAD` and
only when `error.status === 0 || error.status >= 500`; otherwise rethrow immediately (use the `delay` function to throw the error
for the cases you do not retry).

</details>

---

Tests won't catch idempotency keys: retrying a `POST` is only safe when the server de-duplicates by key
(`Idempotency-Key` header). That is the proper answer to "but we need retries on orders" and is discussed in `SOLUTION.md`.
