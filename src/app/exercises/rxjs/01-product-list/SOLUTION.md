# L1 - Product list: solution

## What was wrong

1. **State held in plain fields, assigned from `subscribe`.** `products` and `loading` were
   ordinary properties. The app is zoneless and components are `OnPush` by default, so nothing
   tells Angular to re-render when an HTTP response arrives. The view only refreshed when
   something else (a click) happened to mark the component dirty. With zone.js it "worked by
   accident"; without it, it is broken.
2. **A subscription to a long-lived stream that is never torn down.** `StockFeed.changes$` is a
   root-level `Subject`. Every visit to the page added one more subscriber that was never removed,
   so N visits meant N reloads (and N logs) per stock change, and every destroyed component was
   kept alive by the subject.

## The fix

Derive a signal from the stream instead of mutating fields:

```ts
protected readonly products = toSignal(
  merge(of(undefined), this.stockFeed.changes$).pipe(switchMap(() => this.api.list())),
);
```

- `toSignal` makes the value reactive (the template re-renders) and unsubscribes when the owning
  injection context is destroyed, so no manual teardown is needed.
- `merge(of(undefined), changes$)` expresses "load now and on every change" as one stream.
- `switchMap` drops an in-flight list request if a newer change arrives.
- `undefined` before the first response doubles as the loading state, so the `loading` flag goes
  away (less state to keep in sync).

## Modern Angular / RxJS takeaway

- Zoneless + `OnPush` is the default: anything the template reads must be a signal (or go through
  the `async` pipe). Plain fields mutated in callbacks are a review smell.
- Prefer `toSignal` / `rxResource` over `subscribe` in components. If you must subscribe, use
  `takeUntilDestroyed()` (with `DestroyRef` outside the constructor).
- Never leave `console.log` debugging in reactive code; it hides how often a stream fires.

## What a reviewer should say in the PR comment

> `products`/`loading` are plain fields assigned in `subscribe`. In a zoneless/OnPush app the view
> will not update when the response arrives, so please expose a signal (`toSignal`) instead.
> Also, `stockFeed.changes$` is a root-scoped subject and this subscription is never cleaned up:
> each visit to the page adds another subscriber and causes duplicated requests. Compose the
> initial load and the reloads in one stream with `switchMap` and let `toSignal` own the
> teardown.
