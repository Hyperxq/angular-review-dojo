# S4 - Quick search: solution (the reverse case)

## What was wrong

Someone "modernised" a typeahead by forcing signals onto an **event stream**:

```ts
effect(() => {
  this.api.search(this.term()).subscribe((products) => this.results.set(products));
});
```

- **No time handling.** An `effect` re-runs synchronously with every change of `term`: one request
  per keystroke, and one on creation with the empty string. Signals have no `debounce`.
- **No cancellation and no ordering.** Each `subscribe` is independent, so a slow response for an
  older term overwrites a newer one. A signal write cannot say "forget the previous request".
- **Signals are glitch-free by design, which also means they coalesce.** `term` can change many
  times between two effect runs, and the effect only sees the latest value. That is great for state,
  but wrong when every intermediate event is meant to be debounced, throttled or sequenced.
- **An `effect` that writes to a signal** (`results.set`) is the textbook anti-pattern: derived
  state should be `computed`, `linkedSignal` or a resource, never an effect.

## The fix: keep RxJS where the problem is time

```ts
protected readonly results = toSignal(
  toObservable(this.term).pipe(
    debounceTime(300),
    map((term) => term.trim()),
    distinctUntilChanged(),
    switchMap((term) => (term.length < MIN_LENGTH ? of([]) : this.api.search(term))),
  ),
  { initialValue: [] },
);
```

- `term` stays a signal: the template and the `(input)` handler are simplest that way.
- `toObservable` is the bridge **into** the stream, `toSignal` the bridge **out**. Cross the
  boundary once at each end.
- `debounceTime` + `distinctUntilChanged` (time and dedupe), `switchMap` (latest wins; the previous
  HTTP request is cancelled).
- Equivalent alternative: `rxResource({ params: () => term().trim() || undefined, stream:
  ({ params }) => timer(300).pipe(switchMap(() => api.search(params))) })`. The resource cancels
  the previous stream when `params` change, so the `timer` acts as the debounce, and you get
  `isLoading()` and `error()` for free.
- `toObservable` runs through an effect, so it can skip intermediate values within the same tick.
  That is fine, even desirable, in front of a debounce.

## When signals are NOT the right tool

| You need | Use |
|----------|-----|
| Debounce, throttle, delay, timeouts, intervals | RxJS (`debounceTime`, `auditTime`, `timer`) |
| Cancel superseded async work, or choose a concurrency policy | `switchMap`, `exhaustMap`, `concatMap` |
| Retry with backoff | `retry({ count, delay })` |
| React to **every** event, including repeated equal values | RxJS or an `output`; a signal ignores `set` with an equal value |
| Combine event sources by time (`merge`, `race`, `withLatestFrom`, `fromEvent`) | RxJS |
| A value that completes or errors as part of its meaning (HTTP, websockets) | Observable (then `toSignal` / resource at the edge) |

Signals shine for *state*: a current value, derived values, and fine-grained change detection.
Streams shine for *events over time*. The two cooperate through `toSignal`, `toObservable` and the
resource APIs.

## What a reviewer should say in the PR comment

> An `effect` that fires an HTTP request on every keystroke and writes the response into another
> signal has no debounce, no cancellation and no ordering guarantee, so we hit the API per key and
> stale responses win. This is an event-stream problem: keep `term` as a signal, but pipe
> `toObservable(term)` through `debounceTime`, `distinctUntilChanged` and `switchMap`, and expose
> the result with `toSignal` (or an `rxResource` with the debounce at the source).
