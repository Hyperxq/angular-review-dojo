# L8 - Cart store: solution

## What was wrong

1. **State mutated inside `scan`.** The reducer pushed into arrays and wrote into objects of the
   previous state and returned the same reference. Subscribers (and signals built with `toSignal`,
   whose equality is `Object.is`) saw "no change", and anything holding an earlier state had it
   silently altered. A reducer must be pure: new state out, old state untouched.
2. **Race between an optimistic update and a polling response.** A stock snapshot describes the
   server when the request *started*. If the user reserved a unit after that, applying the late
   snapshot rolled the local stock back up and allowed overselling. Fix: version the state, tag
   each poll with the version it started from, and discard responses older than the current state.
3. **Unhandled error on reservation.** `reserve(...).subscribe()` had no error handler: the error
   became a global unhandled error and the optimistic change was never undone. The fix dispatches a
   compensating `release` action from `catchError`.
4. **Unhandled error ended the polling.** The error travelled through the outer pipeline and
   terminated the subscription: no further polls until reload. Catch it on the inner (per-request)
   observable.
5. **Polling with no lifetime.** The subscription was never torn down (it outlived the store and
   the page that used it) and ignored page visibility, so background tabs kept polling.

## The fix

```ts
visible$.pipe(
  switchMap((visible) => (visible ? timer(0, POLL_MS) : EMPTY)),
  withLatestFrom(this.state$),
  exhaustMap(([, { version }]) =>
    this.api.stock().pipe(
      map((levels) => ({ type: 'stock', levels, requestedAtVersion: version })),
      catchError(() => EMPTY),
    ),
  ),
  takeUntilDestroyed(),
)
```

- `visible$` is built from `visibilitychange`; `switchMap` to `EMPTY` pauses the timer and to a
  fresh `timer(0, ...)` resumes it with an immediate refresh.
- `exhaustMap` makes sure a slow response is not cancelled by the next tick (and requests never pile up).
- `catchError` is inside the inner observable so a failed poll is just a skipped tick.
- `takeUntilDestroyed()` runs in the constructor, i.e. in an injection context, and ties the
  polling to the store's lifetime (the component that provides it).
- The reducer is a pure function returning new objects; `version` makes "is this response still
  relevant?" an explicit, testable question.

## Modern Angular / RxJS takeaway

- Pure reducers + `scan` is a fine pattern, but remember that equality checks (signals, `OnPush`,
  `distinctUntilChanged`) rely on new references. For new code, consider a signal-based store
  (`signal` state + `computed` selectors) with RxJS only at the edges (polling, HTTP).
- Optimistic updates need a rollback path and protection against stale server data.
- Long-lived streams need an explicit lifetime (`takeUntilDestroyed`), a pause policy
  (visibility/online) and per-request error handling.

## What a reviewer should say in the PR comment

> `reduce()` mutates and returns the incoming state, so `scan` emits the same reference and nothing
> downstream can tell the state changed. Return new objects. The poll response can overwrite a
> newer optimistic change; tag requests with a state version and drop stale ones. `reserve()` and
> the polling `switchMap` have no error handling (one leaks an unhandled error and never rolls
> back, the other kills the poll for good). Finally the timer is never torn down and ignores tab
> visibility: pause it on `visibilitychange` and end it with `takeUntilDestroyed()`.
