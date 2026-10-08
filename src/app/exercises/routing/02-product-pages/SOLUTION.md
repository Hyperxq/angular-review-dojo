# L2 - Product pages: solution

## What was wrong

1. **`route.snapshot` read once in `ngOnInit`.** Navigating `/products/1` to `/products/2` matches
   the same route config, so the router **reuses** the component instance: no new constructor, no
   new `ngOnInit`. The snapshot taken at creation time is never refreshed, hence the stale page.
2. **The same mistake for the `tab` query param.** Query params change without destroying the
   component either.
3. **The resolver did not handle errors.** An erroring resolver fails the navigation
   (`NavigationError`): the router stays on the previous page and the error goes to the console
   (or to `withNavigationErrorHandler`, if you configured one). The user sees a dead link.

## The fix

```ts
export class ProductDetailPage {
  readonly product = input.required<Product>();
  readonly tab = input<string>();
}
```

```ts
export const productResolver: ResolveFn<Product> = (route) => {
  const notFound = new RedirectCommand(inject(Router).parseUrl('/not-found'));
  return inject(ProductApi)
    .get(Number(route.paramMap.get('id')))
    .pipe(catchError(() => of(notFound)));
};
```

- With `withComponentInputBinding()` the router writes **path params, matrix params, query params,
  static `data` and resolver results** into the routed component's inputs, and keeps them current
  when the reused instance gets new values. Resolver data has the highest precedence.
- An input whose key is absent from the URL is set to `undefined` (it does not keep the old value),
  so `tab = input<string>()` plus `tab() === 'stock'` in the template needs no extra default.
- A `ResolveFn` may return a `RedirectCommand` (verified in the Angular 22 type definitions:
  `ResolveFn<T> = (...) => MaybeAsync<T | RedirectCommand>`), which is the supported way to
  redirect from a resolver instead of calling `router.navigate()`.
- By default (`runGuardsAndResolvers: 'paramsChange'`) the resolver does not run again when only
  the query string changes, which the spec asserts.

## Modern Angular takeaway

- If a routed component reads `ActivatedRoute` just to get params, it can almost certainly be
  an `input()`. If it needs a stream anyway, use `route.paramMap` (an observable), never the snapshot,
  unless the component is guaranteed to be recreated.
- Resolvers are for data the page cannot render without. Give them an error path.

## What a reviewer should say in the PR comment

> `route.snapshot` is read once in `ngOnInit`, but the router reuses this component when only
> the params or query params change, so the page goes stale. Bind them with `withComponentInputBinding`
> and signal `input()`s (resolver data is bound as well). Also catch the error in `productResolver`
> and return a `RedirectCommand` to the not-found page, otherwise a bad id just cancels the navigation.
