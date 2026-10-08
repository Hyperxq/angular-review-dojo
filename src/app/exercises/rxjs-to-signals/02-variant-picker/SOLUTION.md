# S2 - Variant picker: solution

## What was wrong

**The behavioural bug: stale local state.** The selected variant id lived in a `BehaviorSubject`
that was never reset. When the parent passed another product, Angular reused the same component
instance, `ngOnChanges` pushed the new product into `product$`, and `combineLatest` happily combined
it with the old `selectedId`. Variant ids (`standard`, `bundle`, `limited`) are shared by every
product, so the stale id resolved to a real variant of the new product: no error, just a wrong
selection and a wrong price.

**The smells**: `@Input` + `ngOnChanges` + `ReplaySubject` just to turn an input into a stream,
a hand-written `combineLatest` view model, `| async` with an `@if ... as` wrapper, and the manual
`select()` method.

## The fix

```ts
readonly product = input.required<Product>();
private readonly productId = computed(() => this.product().id);
protected readonly variants = computed(() => variantsFor(this.product()));
protected readonly selectedId = linkedSignal({
  source: this.productId,
  computation: () => 'standard',
});
protected readonly selected = computed(() => ...);
protected readonly price = computed(() => this.product().price + this.selected().priceDelta);
```

- `input.required()` replaces `@Input` + `ngOnChanges` + `Subject`.
- `computed()` replaces the `combineLatest` + `map` view model.
- `linkedSignal` is a *writable* signal that is recomputed whenever its `source` changes. The
  user can still `set()` it (a click), and a new product resets it to the default.
- Using the product **id** as the source (not the whole object) is deliberate: when the parent
  refreshes the **same** product (new object, same id) the user's selection is kept. The last
  spec in the file guards that behaviour.
- Gotcha: `source: () => this.product().id` is *not* enough. `linkedSignal` re-runs its
  `computation` whenever the signals read by `source` notify, and that closure reads `product`, so
  any new product object would reset the selection. Wrapping the id in a `computed` (whose
  equality check stops propagation when the id is unchanged) gives the intended behaviour.

## Modern Angular takeaway

- "State derived from an input that the user can override" is exactly the use case for
  `linkedSignal`. Before it existed you needed `ngOnChanges` and manual resets (or an `effect`
  writing into a signal, which is an anti-pattern).
- Choose the `source` to match the identity you want to reset on, not the reference.
- `linkedSignal` also supports `set` and a `previous` argument in `computation` to keep the old
  value when it is still valid (for example keep the selected size if the new product has it).

## What a reviewer should say in the PR comment

> The selected variant is kept in a `BehaviorSubject` that is never reset, so switching to another
> product keeps the previous product's selection (and price). Use `input.required()`, derive the
> variants and the price with `computed()`, and make the selection a `linkedSignal` keyed on the
> product id so it resets when the product changes but survives a refresh of the same product.
