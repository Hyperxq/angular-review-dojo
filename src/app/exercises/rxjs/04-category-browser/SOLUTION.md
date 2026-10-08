# L4 - Category browser: solution

## What was wrong

1. **`catchError` on the outer stream.** An error in one request travelled up through `switchMap`
   to the outer pipeline, where `catchError` replaced the whole stream with a single `of(...)`
   that then completed. The subscription to the tab clicks was gone: the page was dead until reload.
   Rule: an error terminates the stream it travels through, so handle it on the inner observable.
2. **`retry(3)` on the outer stream with no delay.** Retrying re-subscribed to the
   `BehaviorSubject`, which replays its value synchronously, so three more requests went out
   immediately: a retry storm against a backend that was already failing.

## The fix

```ts
switchMap((category) =>
  this.api.byCategory(category).pipe(
    retry({ count: 3, delay: (_error, attempt) => timer(250 * 2 ** (attempt - 1)) }),
    map((products): ViewState => ({ status: 'ready', products })),
    catchError(() => of<ViewState>({ status: 'error', products: [] })),
  ),
)
```

- Retry and `catchError` live inside the projection, so a failed request becomes a value
  (`error` state) and the outer stream stays alive.
- `retry({ count, delay })` is the RxJS 7.3+ config form. `delay` receives the error and the retry
  attempt (starting at 1) and returns a notifier: 250ms, 500ms, 1000ms is an exponential backoff.
  (The old `retryWhen` is deprecated.)
- If the user picks another tab while retrying, `switchMap` cancels the pending retries.

## Modern Angular / RxJS takeaway

- Handle errors as close to their source as possible; keep long-lived streams (user intent, route
  params, polling) alive by converting errors into values inside the inner observable.
- Never retry immediately and unconditionally. Add a delay/backoff and a limit, and retry only
  errors that can be transient (5xx, network), not 4xx.
- `rxResource` does this per request for you: an error puts the resource in the `error` status
  and the next `params` change loads again.

## What a reviewer should say in the PR comment

> `catchError` and `retry` are applied after `switchMap`, on the outer stream. The first error
> completes the pipeline, so the tabs stop working, and `retry(3)` re-subscribes to the
> `BehaviorSubject` which re-fires the request three times back to back. Move both inside the
> `switchMap`, use `retry({ count, delay })` with a backoff, and map the final error to an error
> state.
