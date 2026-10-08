# L7 - Order panel: solution

## What was wrong

1. **`combineLatest` used as "when X happens, read the latest Y".** In `placeOrder$`,
   `combineLatest([click$, line$])` emits whenever *either* input emits once both have a value. After
   the first click, every quantity change re-triggered the submit. The click is the trigger, the
   line is only data: that is `withLatestFrom`.
2. **A glitch from combining two views of the same source.** `lineTotal$` built the total from
   `line$.pipe(map(product))` and `line$.pipe(map(quantity))`. One change of `line$` reaches the two
   branches one after the other, so `combineLatest` first emits (new product, old quantity), a
   total that never existed, and then the right one. Derive from the source once instead:
   `line$.pipe(map(line => line.product.price * line.quantity))`.
3. **A custom operator that ignores the Observable contract.** `withPrevious`
   - did not forward `complete`, so downstream never completed;
   - did not forward `error`, so errors became unhandled and the consumer never saw them;
   - did not return the source subscription, so unsubscribing downstream left the source running
     (a leak).

## The fix

```ts
click$.pipe(withLatestFrom(line$), exhaustMap(([, line]) => submit(...)))
```

```ts
return source.subscribe({
  next: ...,
  error: (e) => subscriber.error(e),
  complete: () => subscriber.complete(),
}); // returning the Subscription is the teardown
```

## Modern RxJS takeaway

- `combineLatest`: "recompute when anything changes" (derived state). `withLatestFrom`: "when A
  happens, take the latest of B". `sample`/`audit`: sample a stream on another's schedule.
- Never combine two projections of the same stream; project once. Glitches come from diamonds in
  the dependency graph (signals avoid them by design: `computed` is glitch-free).
- Prefer composing existing operators (`pairwise`, or `scan((acc, v) => [acc[1], v], ...)`) over
  writing `new Observable`. If you must, forward all three notifications and return the teardown.
- Marble tests (`TestScheduler.run`) are the right tool for timing/ordering/unsubscription
  assertions: `expectObservable`, `expectSubscriptions` and the `!` unsubscribe marker.

## What a reviewer should say in the PR comment

> `combineLatest([click$, line$])` re-submits the order on every quantity change after the first
> click: use `click$.pipe(withLatestFrom(line$), exhaustMap(...))`. The total combines two
> projections of the same stream and emits an inconsistent intermediate value; a single `map`
> avoids the glitch. `withPrevious` swallows `error`/`complete` and never tears down its source
> subscription; forward both and return the subscription (or build it from `scan`/`pairwise`).
