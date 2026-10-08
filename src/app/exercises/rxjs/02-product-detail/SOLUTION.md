# L2 - Product detail: solution

## What was wrong

1. **Nested subscribes.** Product, then category, then related products were chained by
   subscribing inside a subscribe callback. Nothing can cancel or compose that chain, and errors
   have no single place to go.
2. **No cancellation when `id` changes.** The `effect` started a new chain on every change but
   never cancelled the previous one. Responses are applied in arrival order, not request order, so
   a slow response for product A overwrote the newer state for product B (at every level of the
   chain, which also mixed categories and related lists).
3. **Needless sequencing.** The related products only need `product.category`, yet they waited for
   the category request.
4. **Async work started from an `effect`.** Effects are for side effects that leave the reactive
   graph, not for fetching data into signals.

## The fix

```ts
protected readonly detail = rxResource({
  params: () => this.id(),
  stream: ({ params: id }) =>
    this.api.get(id).pipe(
      switchMap((product) =>
        forkJoin({ category: ..., related: ... }).pipe(map(...)),
      ),
    ),
});
```

- `switchMap` maps one value to an inner observable and unsubscribes from the previous inner one,
  so only the latest chain can produce a result.
- `forkJoin` runs the two independent requests in parallel.
- `rxResource` re-runs when `params` change, cancels the previous stream and exposes `value`,
  `status`, `error` and `isLoading` signals. Angular 22 names the options `params` and `stream`
  (the old `request`/`loader` names from v19 previews are gone).

## Modern Angular / RxJS takeaway

- Nested `subscribe` is always a code smell: use `switchMap`/`concatMap`/`mergeMap`/`exhaustMap`.
- Data derived from a signal input belongs in `rxResource`/`resource`/`toSignal`, not in `effect`.
- Choose the flattening operator by the question "what should happen to the old inner request?".
  Here the answer is "discard it": `switchMap`.

## What a reviewer should say in the PR comment

> The three nested `subscribe` calls inside the `effect` race: if the user navigates quickly, a
> late response for the previous product overwrites the newer one, and nothing cancels the old
> chain. Please flatten with `switchMap`, fetch category and related products in parallel with
> `forkJoin`, and use `rxResource` keyed on `id()` so cancellation and loading state are handled
> for us.
