# RxJS to Signals: cheat sheet

Code written the Angular 19 way still compiles in Angular 22, but signals are now the simpler
correct tool for most component and service state. The exercises in this folder pair each old
pattern with a real bug it caused. The last one is the reverse case.

| Old RxJS pattern | Modern equivalent | Notes |
|------------------|-------------------|-------|
| `BehaviorSubject` + `.next()` + `.asObservable()` as a store | `signal()` + `.asReadonly()` | Update immutably with `update()`. A signal always has a current value |
| `combineLatest([a$, b$]).pipe(map(...))` for derived values | `computed(() => ...)` | `computed` is lazy, memoised and glitch-free |
| `@Input() set x(v)` / `ngOnChanges` + `Subject` | `input()` / `input.required()` + `computed()` | `transform` replaces most input setters |
| Local state that must reset when an input changes | `linkedSignal()` | Writable, recomputed when its source changes |
| `x$ \| async` (several times) | read a signal in the template | One subscription, no `null` initial value |
| `route.paramMap.pipe(switchMap(http))` + `loading`/`error` flags + `takeUntil(destroy$)` | `withComponentInputBinding()` + `input()` + `rxResource()` / `httpResource()` | `value`, `status`, `error`, `isLoading` come for free and the previous request is cancelled |
| `subscribe(v => this.field = v)` | `toSignal(source$)` | Unsubscribes on destroy. Must run in an injection context |
| `takeUntil(this.destroy$)` + `ngOnDestroy` | `takeUntilDestroyed(destroyRef?)` | Outside a constructor/field initializer, pass a `DestroyRef` |
| Signal to stream | `toObservable(sig)` | Emits asynchronously (effect timing), so intermediate values can be skipped |

## When RxJS still wins

Signals hold *values*; RxJS models *events over time*. Keep (or reach for) RxJS when you need:

- **Time**: `debounceTime`, `throttleTime`, `auditTime`, `timer`, `interval`, `delay`.
- **Cancellation and ordering of async work**: `switchMap`, `exhaustMap`, `concatMap`.
- **Retries and backoff**: `retry({ count, delay })`.
- **Combining event streams**: `merge`, `race`, `withLatestFrom` (sample on an event), `fromEvent`.
- **Multicasting a hot or long-lived source**: `share`, `shareReplay({ refCount: true })`.
- **Anything that completes or errors** as part of its meaning (a request, a websocket).

Rules of thumb:

1. State that a template reads: signal. Events and async flows: RxJS.
2. `effect()` is for side effects that leave Angular (logging, `localStorage`, DOM APIs, analytics). Do
   not use it to fetch data or to copy one signal into another: use `computed`, `linkedSignal`, or
   a resource.
3. Cross the boundary once, at the edge: `toSignal` on the way into the template,
   `toObservable` on the way into an operator pipeline.
