# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Going from `/products/1` to `/products/2` does not create a new component: the router **reuses**
the existing instance because it is the same route. When does `ngOnInit` run again?

</details>

<details><summary>Hint 2 - area</summary>

- A `snapshot` is a photo of the route at one moment. What would give you the current value
  every time it changes?
- App-level routing is configured with `withComponentInputBinding()` (see `app.config.ts`). What
  does it bind to component inputs? Check the Angular docs or the type definitions.
- What happens to a navigation when a resolver's observable errors?

</details>

<details><summary>Hint 3 - near the answer</summary>

Replace the snapshot reads with signal inputs: route params, query params **and resolver data**
are bound to inputs of the routed component (`product = input.required<Product>()`,
`tab = input<string>()`). An input that is absent from the URL is set to `undefined`, so apply the
default in the template or with a `computed`. In the resolver, catch the error and return a
`RedirectCommand` (resolvers are allowed to return one) pointing at the not-found page.

</details>
