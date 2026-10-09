# L3 - Token refresh: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | Every `401` starts its own refresh: N concurrent requests, N refresh calls (and with rotating refresh tokens, a forced logout). | **blocking** |
| 2 | The replay re-sends the request cloned **before** the refresh: it carries the old token and fails again. | **blocking** |
| 3 | The refresh call goes through the same interceptor: when the refresh itself is refused, it triggers another refresh, forever. | **blocking** |
| 4 | A failed refresh surfaces as a raw `HttpErrorResponse` per caller; the session is never ended. | **blocking** |
| 5 | `logout()` only clears a signal: an in-flight refresh sets the token again, and in-flight requests deliver data after sign-out. | **blocking** (security) |
| 6 | The refresh token is not visible here; where it lives (HttpOnly cookie vs. storage) is the real security question. | question |
| 7 | Several tabs refresh independently: a rotating refresh token needs a cross-tab lock. | should-fix (not testable here) |

## Why

The interceptor body runs once per request, so any "single flight" logic has to live in a place that survives across
requests: a shared observable owned by a service. `share()` makes the one HTTP call serve every subscriber and resets when the
call ends, so the next expiry starts a new refresh. Replaying means *building a new request with the new token* (requests are immutable;
`req.clone` from before the refresh still has the old header). The refresh request must be exempt (an `HttpContextToken` flag
is the supported way to carry per-request intent through interceptors).

Session end is an event: model it as one (`Subject`), and tie every long-lived operation to it with `takeUntil`. Unsubscribing from
an `HttpClient` observable cancels the request (the `TestRequest.cancelled` flag in the spec). A notifier that **errors** makes
cancellation visible to callers (`AuthError('ended')`) instead of silently completing.

## The fix (shape)

```ts
private readonly refresh$ = this.http.post('/auth/refresh', null, { context: new HttpContext().set(SKIP_AUTH, true) }).pipe(
  map((r) => r.token), tap((t) => this.token.set(t)),
  takeUntil(this.loggedOut), throwIfEmpty(() => new AuthError('ended')),
  catchError(... token.set(null); throwError(() => new AuthError('expired'))),
  share(),
);

next(withToken(auth.token())).pipe(
  catchError((e) => e.status === 401 ? auth.refresh().pipe(switchMap((token) => next(withToken(token)))) : throwError(() => e)),
  takeUntil(auth.sessionEnded$),
);
```

## What the tests can and cannot prove

`HttpTestingController` lets the spec decide the order of responses, which is how races and loops are tested deterministically.
It cannot show real timing, multiple tabs, or what a user sees. The "loop" test relies on the spec noticing a **second**
`/auth/refresh` request instead of waiting for an infinite one.

## Tradeoffs and discussion

- **Interceptor vs. `HttpHandler` wrapper or a dedicated API client:** an interceptor is global (every call, including third parties
  unless filtered; see the security track). A client class per API is explicit but must be used everywhere.
- **Proactive vs. reactive refresh:** refreshing a little before `exp` avoids the failed call but needs clock handling and still
  needs this reactive path as a fallback.
- **Queueing vs. failing waiters on refresh failure:** failing all with one error (done here) is simple; some apps park requests
  until the user logs in again.
- **Idempotency:** replaying a `POST` after a `401` is safe because the request was rejected before executing; still keep an eye on it.

## What a reviewer should say in the PR comment

> **Blocking:** each `401` triggers its own refresh; with rotating refresh tokens that logs users out. Share a single in-flight refresh
> (`share()`) and replay with the **new** token. **Blocking:** the refresh request goes through the interceptor and loops when it fails; tag it
> with an `HttpContextToken` and skip it, and end the session once on failure. **Blocking:** `logout()` must cancel the refresh and the in-flight
> requests (`takeUntil`) and a late response must not set the token again. *Should-fix:* think about two tabs refreshing at once.
