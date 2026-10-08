# L1 - Product grid: solution

## What was wrong

1. **`track $index` on a list that can be reordered.** Angular reuses the DOM node at each
   position, so after sorting, the row at index 0 keeps its `<input>` (and the typed value) while its
   text bindings now show another product. Anything that lives in the DOM and not in the data
   (typed text, focus, scroll, CSS animation state) stays behind.
2. **`track item` (object identity) on data that is re-fetched.** The refresh produced new
   objects with the same content, so every item looked "new" and the whole list was destroyed and
   recreated. Angular even says so in dev mode: `NG0956: The configured tracking expression (track
   by identity) caused re-creation of the entire collection`.
3. **An expensive method call in the template.** `pricing.discountedPrice(product)` is evaluated on
   every check of the view, i.e. after every event handled by the component, whether the products
   changed or not (36 calls instead of 12 in the spec).

## The fix

```html
@for (row of rows(); track row.product.id) { ... {{ row.price | currency }} ... }
@for (item of stock(); track item.id) { ... }
```
```ts
private readonly priced = computed(() =>
  this.products().map((product) => ({ product, price: this.pricing.discountedPrice(product) })),
);
protected readonly rows = computed(() =>
  this.sortedByPrice() ? [...this.priced()].sort((a, b) => a.price - b.price) : this.priced(),
);
```

`@for` makes `track` mandatory (it is a compile error to omit it), which is exactly why the choice
deserves a review comment: the framework cannot know your business key.

`computed` is lazy and memoised: `priced` only re-runs when `products()` changes, and sorting
reuses its result.

## Modern Angular takeaway

- `track` = the stable business key (`id`). `$index` only for lists that never reorder and hold no
  DOM state. Object identity only for lists whose objects are stable.
- No work in the template except reading signals and cheap pipes. Derive with `computed`.
- Pure pipes are the other memoising option, but a `computed` keeps the derivation next to its data.

## What a reviewer should say in the PR comment

> `track $index` on a sortable list leaves the quantity inputs behind when rows move, and
> `track item` recreates the whole stock list on every refresh: track by `id`. Also
> `discountedPrice()` is called from the template, so it runs on every change detection; derive the
> rows with a `computed`.
