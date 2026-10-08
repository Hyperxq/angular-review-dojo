# L1 - Product badge: solution

## What was wrong

1. **`this.product` read in the constructor.** Inputs are set *after* construction (the framework creates the instance, then
   binds the inputs, then calls the first `ngOnChanges`/`ngOnInit`). In the constructor `product` is `undefined`; the optional
   chain `?.` turned the crash into a silently empty tag. A silent empty value is worse than an exception.
2. **State derived once in `ngOnInit`.** `ngOnInit` runs once, after the first input binding. When the parent later passes
   another product, nothing recomputed `discountLabel`. Copying inputs into fields is the Angular-19 pattern that signals replace.
3. **A typo in a string key** (`changes['produt']`). `SimpleChanges` is a dictionary typed `{ [key: string]: SimpleChange }`:
   the compiler cannot check the key, so the reset never ran. With `input()` there is no stringly typed API.
4. **A mutated input.** `this.product().stock--` changes a property of the object but not its reference. `ngOnChanges`
   fires (and OnPush and signals notice) only when the binding receives a **new reference**, so the badge never knew the stock changed.

## The fix

```ts
readonly product = input.required<Product>();
protected readonly tag = computed(() => this.product().category.toUpperCase());
protected readonly discountLabel = computed(() => (this.product().stock <= 2 ? '20% off' : ''));
protected readonly expanded = linkedSignal({ source: this.product, computation: () => false });
```
and in the parent: `this.product.update((p) => ({ ...p, stock: p.stock - 1 }))`.

`linkedSignal` is the answer to "local, writable state that must reset when an input changes": the writable twin of `computed`.

## Hook order and what replaces each hook

See `src/app/exercises/lifecycle/README.md` for the full table. In short: `constructor` (no inputs yet) -> `ngOnChanges` ->
`ngOnInit` -> `ngDoCheck` -> content hooks -> view hooks -> `ngOnDestroy`. With signal inputs you rarely need any of the first
four.

## What a reviewer should say in the PR comment

> Inputs are read in the constructor (always undefined) and copied into fields in `ngOnInit`, so the badge never reacts to
> changes; `changes['produt']` is a typo that the compiler cannot catch. Use `input()` and derive with `computed`, reset local
> state with `linkedSignal`, and don't mutate objects you pass down.
