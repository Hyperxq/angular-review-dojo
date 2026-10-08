# Lifecycle: hook order, modern replacements, new pitfalls

Facts here are from the installed Angular 22.2.2 type definitions and from running the exercises in this folder.

## Order of events for one component

```
constructor                    inputs are NOT set yet (signal inputs: reading a required one throws NG0950)
  -> ngOnChanges               only for decorator @Input()s, when a binding gets a new reference
  -> ngOnInit                  once, after the first binding
  -> ngDoCheck                 every time the PARENT view is checked (even for OnPush children)
  -> ngAfterContentInit        once, after projected content is initialised
  -> ngAfterContentChecked     after every check of projected content
  -> (the component's own template is created / refreshed)
  -> ngAfterViewInit           once, after the component's view (and children's views) are initialised
  -> ngAfterViewChecked        after every check of the view
  -> afterNextRender / afterEveryRender / afterRenderEffect callbacks   after the whole application finished rendering (browser only)
  ...
  -> ngOnDestroy / DestroyRef.onDestroy callbacks
```

## Classic hook use and its modern replacement

| Classic use | Modern replacement | Why |
|-------------|--------------------|-----|
| Read an input in the constructor | Read the signal where it is used (`computed`, template, `effect`) | Inputs are set after construction |
| Copy an input into a field in `ngOnInit` | `computed(() => f(this.input()))` | `ngOnInit` runs once; the input changes later |
| `ngOnChanges(changes)` to react to input changes | `computed` / `effect` on the signal input; `linkedSignal` for local state that resets | No stringly typed keys; no mutation trap |
| Reset local state when an input changes | `linkedSignal({ source, computation })` | Writable `computed` |
| `@ViewChild` read in `ngAfterViewInit` | `viewChild()` / `viewChildren()` signal queries read in `computed`/`effect` | Tracks the element as it appears and disappears (`@if`, `@for`) |
| Measure the DOM in `ngAfterViewInit` | `afterNextRender({ read })` and a signal | Browser-only, phases avoid layout thrashing |
| Re-run a measurement when something changes | `afterRenderEffect` | Re-runs when the signals it reads change |
| Work in `ngDoCheck` / `ngAfterViewChecked` | `computed` | Runs when dependencies change, not every pass |
| `ngOnDestroy` with `Subscription`/`Subject` bookkeeping | `DestroyRef.onDestroy`, `takeUntilDestroyed`, `toSignal`, `rxResource` | Cleanup registered next to the creation |
| `async ngOnInit` to load data | `rxResource` / `httpResource` | Angular ignores the returned promise |
| Base class with shared hooks | Composition: injected services, `inject(DestroyRef)`, host directives | Nothing to forget to call via `super` |

## New pitfalls introduced by the modern primitives

- **`effect` is not a derived value.** An effect that only calls `set` on another signal is stale until it runs. Use
  `computed` or `linkedSignal` (Lifecycle L3, Performance L2).
- **Reads that short-circuit are not tracked.** `effect(() => this.chart?.update(this.series()))` never subscribes to
  `series` while `chart` is undefined (Memory L3). Read signals first.
- **Required signal inputs throw if read too early.** Reading `input.required()` in the constructor throws; reading a regular
  input there returns its default.
- **`resource.value()` throws in the error state.** Check `hasValue()`/`error()` (Lifecycle L3).
- **`whenStable()` waits for pending resources and effects scheduled by them,** so a request that never completes hangs a test.
- **Render hooks run in the browser only,** which is a feature (SSR safety) and a trap if your test environment needs the DOM
  work to run.
- **Writing a signal inside a render hook triggers another render.** That is how you apply a measurement, but guard against
  loops (the application stops after 10 rounds in dev mode with NG0103).

## Exercises in this folder

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-badge` | constructor/`ngOnInit`/`ngOnChanges` pitfalls, `input()`, `computed`, `linkedSignal` |
| L2 | `02-chart-frame` | view queries and DOM timing, render hooks, `computed` vs `ngAfterViewChecked` |
| L3 | `03-list-widgets` | inheritance and hooks, `async ngOnInit`, `effect` as `ngOnChanges`, `afterNextRender` vs `afterRenderEffect` |
