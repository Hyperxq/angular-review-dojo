# L3 - List widgets: solution

## What was wrong

1. **`CategoryList` overrode `ngOnInit` without calling `super.ngOnInit()`.** With inheritance the base hook is replaced, not
   extended. The request was never started (`loading` stayed true). TypeScript does not warn: `override` only checks the
   name.
2. **`FeaturedList` overrode `ngOnDestroy` without `super.ngOnDestroy()`.** The base class's `Subscription` was never
   unsubscribed: the request kept the component alive. The mirror image of problem 1, and just as invisible.
3. **`async ngOnInit()`.** Angular calls the hook and ignores the returned promise: it does not wait for it (the template
   renders immediately, with `summary` still `undefined`, hence the crash) and it cannot catch its rejection (it surfaces as an
   unhandled promise rejection). The `!` on `summary!: Summary` silenced the compiler instead of modelling "not loaded yet".
4. **`effect(() => draft.set(price()))`.** An effect runs asynchronously, during change detection. Between `setInput` and the
   effect, `draft()` still holds the old value, which any synchronous reader (a validator, a computed) sees. A `linkedSignal` is
   a writable signal that is recomputed from its source **at read time**: never stale, still writable by the user.
5. **`afterNextRender` for something that must repeat.** It runs once. The label measurement needs to run after each
   render in which `label` changed: `afterRenderEffect` re-runs whenever the signals it reads change.

## The fix

```ts
// no base class: a resource gives value / isLoading / error, cancels and unsubscribes with the component
protected readonly products = rxResource({
  params: () => this.category(),
  stream: ({ params: category }) => this.api.byCategory(category),
});

protected readonly stock = rxResource({ stream: () => this.api.stock() });
protected readonly summary = computed(() => { const stock = this.stock.value(); return stock && {...}; });

readonly draft = linkedSignal(() => this.price());

afterRenderEffect(() => { this.label(); this.width.set(this.host.nativeElement.querySelector('.label')!.offsetWidth); });
```

## Facts verified while writing this exercise

- Reading `resource.value()` while the resource is in the **error** state throws (`ResourceValueError`). Guard with
  `hasValue()` (or check `error()`/`status()`) before reading, as the templates do.
- `whenStable()` waits for pending resources. A request that never emits (a `Subject` in a test) makes
  `await fixture.whenStable()` hang; use `fixture.detectChanges()` plus a macrotask turn in such a test.
- `rxResource` without `params` runs its `stream` once; with `params` it re-runs when they change and cancels the previous request.

## Why composition beats the base class here

The base class bundled three concerns (load, loading/failed flags, teardown) behind two lifecycle hooks that subclasses must
remember to call. `rxResource` + `DestroyRef`-managed teardown give the same behaviour with no protocol to remember, and each
widget declares exactly what it needs.

## What a reviewer should say in the PR comment

> `CategoryList.ngOnInit` and `FeaturedList.ngOnDestroy` override the base hooks without calling `super`, so one never loads
> and the other leaks its subscription. `async ngOnInit` is not awaited by Angular (template renders with `summary`
> undefined, rejection unhandled). `effect` that only copies a signal should be a `linkedSignal`, and `afterNextRender` can't
> re-measure on input changes (`afterRenderEffect`). Replace the base class with `rxResource`.
