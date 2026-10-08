# L5 - Catalog stats: solution

## What was wrong

1. **A cold observable subscribed three times.** `products$` is the result of `http.get`, which is
   cold: every subscriber triggers its own request. The template used `products$ | async` three
   times, so three requests.
2. **`Subject` used for state.** A `Subject` has no memory. Anyone subscribing after `select()` was
   called (a panel that renders later, a component behind an `@if`) never sees the current value.
   State needs a "current value": `BehaviorSubject` or a signal.
3. **`shareReplay(1)` without `refCount`.** `shareReplay(1)` is shorthand for
   `{ bufferSize: 1, refCount: false }`: once connected, the source (here an endless 30s timer)
   stays subscribed forever, even with zero subscribers, and every product ever watched is kept
   polling. The cached value also outlives its usefulness, so a new watcher gets an arbitrarily
   old price first.

## The fix

```ts
// 1. one subscription, derived state computed
protected readonly products = toSignal(inject(ProductApi).list(), { initialValue: [] });
protected readonly inventoryValue = computed(() => this.products().reduce(...));

// 2. state with a current value
private readonly selection = new BehaviorSubject<Product | null>(null);

// 3. disconnect when the last subscriber leaves
shareReplay({ bufferSize: 1, refCount: true })
```

## Modern Angular / RxJS takeaway

- In components prefer `toSignal` + `computed` over several `| async` on the same observable. The
  signal subscribes once, and the totals are memoised.
- `Subject` = events, `BehaviorSubject`/`ReplaySubject`/signals = state. In new code a
  `signal()` with `asReadonly()` is usually the simplest store.
- Whenever a shared stream is long-lived (timers, sockets, polling) use `refCount: true`
  (or `share({ resetOnRefCountZero: true, connector: () => new ReplaySubject(1) })`). Keep the
  default `shareReplay(1)` for finite, cacheable sources only.

## What a reviewer should say in the PR comment

> `products$` is cold and used with three `| async` pipes, which sends three requests: convert it
> once with `toSignal` and derive the totals with `computed`. `SelectionStore` uses a plain
> `Subject`, so late subscribers miss the current selection; use a `BehaviorSubject` or a signal.
> `shareReplay(1)` without `refCount: true` keeps the 30s polling timer alive forever per product
> and replays stale prices; use `shareReplay({ bufferSize: 1, refCount: true })`.
