# L2 - Orders client: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `retryInterceptor` retries **every** method, including `POST /orders`: a non-idempotent write sent up to three times (double charges). | **blocking** |
| 2 | It retries every error, including `4xx`: a 404 or 422 will never succeed. | **blocking** |
| 3 | `errorToastInterceptor` sits **inside** the retry (after it in the list), so it sees every attempt: three toasts for one failed call, and a toast even when a later attempt succeeds. | **blocking** |
| 4 | `authInterceptor` is outermost and `retry` re-subscribes to an observable whose downstream interceptors already ran: the retries reuse the first attempt's token. | **blocking** |
| 5 | No jitter in the back-off; many clients retrying together re-create the outage. | should-fix |
| 6 | No `Idempotency-Key` on order creation, which is the safe way to retry writes. | should-fix |

## Why

- **Order.** In `withInterceptors([a, b, c])` the request goes through `a`, then `b`, then `c`, then the backend; the response comes
  back through `c`, `b`, `a`. An interceptor sees everything *below* it as one observable. A toast interceptor must be **above** the
  retry (so it sees only the final outcome); the auth interceptor must be **below** it (so each attempt gets a fresh token).
- **Re-subscription does not re-run interceptor functions.** Verified experimentally: with `[retry, auth]` and a plain
  `next(req).pipe(retry(1))`, the auth function body ran once and both attempts had the same header. `next(req)` builds the
  downstream chain once when it is called; `retry` re-subscribes the resulting observable. Use `defer(() => next(req))` in the retrying
  interceptor so every attempt calls `next` again.
- **Retry policy is about safety, not hope.** Repeat only requests that are idempotent (`GET`, `HEAD`; `PUT`/`DELETE` if the API is
  designed so) and failures that can be transient (`status === 0` network, `5xx`, optionally `429` with `Retry-After`). Anything
  else must surface immediately. Throwing from the `delay` function of `retry` ends the retries with that error.

## The fix

```ts
provideHttpClient(withInterceptors([errorToastInterceptor, retryInterceptor, authInterceptor]));

defer(() => next(req)).pipe(retry({
  count: 2,
  delay: (error, attempt) => isRetryable(req, error) ? timer(delay * attempt) : throwError(() => error),
}));
```

## Tradeoffs and discussion

- **Interceptors vs. a retry operator at the call site:** a global interceptor applies the policy everywhere (and hides it from
  readers); a `retry` in the service is explicit and can differ per call. For payments prefer explicit.
- **Idempotency keys:** to retry `POST /orders` safely the client generates a UUID per order and sends it as `Idempotency-Key`;
  the server stores the first result per key. Then the retry policy may include writes.
- **Toast vs. error handler:** one interceptor that both shows and reports the error couples UX to transport; many teams
  emit an event/signal and let a single component render toasts.

## What a reviewer should say in the PR comment

> **Blocking:** retrying `POST /orders` double-charges when the first response is lost; restrict retries to idempotent methods
> (or add idempotency keys). **Blocking:** retrying 4xx is pointless, limit to network/5xx. **Blocking:** the toast interceptor is
> below the retry so it fires per attempt; move it above. **Blocking:** `retry` re-subscribes an already-built chain so the token isn't
> refreshed: wrap `next(req)` in `defer` and put auth below the retry. *Should-fix:* jitter.
