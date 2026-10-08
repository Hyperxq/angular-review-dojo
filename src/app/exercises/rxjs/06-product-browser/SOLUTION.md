# L6 - Product browser: solution

## What was wrong

1. **`effect` used to fetch and push into a `Subject` that feeds `toSignal`.** Three problems in
   one: effects are not meant to start async work whose result flows back into the reactive graph;
   the subscription inside the effect is never cancelled when `category` changes (so responses
   race and a slow one wins); and the `Subject` + `toSignal` pair is a hand-rolled, leaky
   `rxResource`.
2. **`toSignal()` called from an event handler.** `toSignal` (like `inject`, `effect`,
   `takeUntilDestroyed()` without argument) needs an injection context, i.e. a constructor or a
   field initializer. In a click handler it throws `NG0203`, so the feature never worked. The
   result was also stored in a plain field assigned later, which is awkward for a template.
3. **`takeUntilDestroyed()` without a `DestroyRef` called from a method.** Same `NG0203`. It also
   ran after `watching.set(true)`, which is why the button looked "used" but did nothing.

## The fix

```ts
protected readonly products = rxResource({
  params: () => this.category(),
  stream: ({ params: category }) => this.api.byCategory(category),
  defaultValue: [],
});

protected readonly comparing = signal(false);
protected readonly comparison = rxResource({
  params: () => (this.comparing() ? this.category() : undefined),
  stream: ({ params }) => this.api.byCategory(params).pipe(map(sortByPrice)),
});

private readonly destroyRef = inject(DestroyRef);
... takeUntilDestroyed(this.destroyRef)
```

- `rxResource` re-runs when `params()` changes, **unsubscribes from the previous stream** and
  exposes `value`, `status`, `error`, `isLoading`. A `params` that returns `undefined` keeps the
  resource `idle`: perfect for "load on demand".
- Create reactive primitives up front and let an event only flip a signal (`comparing.set(true)`).
- When an API genuinely must be called later, capture the context: inject `DestroyRef` /
  `Injector` as fields and pass them (`takeUntilDestroyed(destroyRef)`,
  `toSignal(x, { injector })`, or `runInInjectionContext`).

## Angular 22 vs 19 notes

`rxResource` options are `params` and `stream` (v19 previews used `request` and `loader`). It also
registers a pending task, so `fixture.whenStable()` waits for in-flight resource requests; the spec
uses a small `settle()` helper for that reason.

## What a reviewer should say in the PR comment

> `toSignal()` and `takeUntilDestroyed()` are being called from click handlers, outside an
> injection context, so they throw NG0203 and the features silently die. Create the signals as
> fields (an `rxResource` with `params` that stays `undefined` until the user opts in) and inject
> `DestroyRef` for the manual subscription. The `effect` that subscribes and pushes into a
> `Subject` is a racy re-implementation of `rxResource`; replace it.
