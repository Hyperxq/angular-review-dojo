# L4 - Hints

<details><summary>Hint 1 - nudge</summary>

Four places decide what ends up in the first bundle: the route config, a template block, an
`import` line at the top of a component, and the router's preloading setup. Check what is
imported **statically** and what is loaded on demand.

</details>

<details><summary>Hint 2 - area</summary>

- `component: X` needs `X` at the moment the route file is loaded. Which property loads it later?
- A heavy dependency imported at the top of a file is always in that file's chunk. The `import()`
  expression is the on-demand version (it returns a promise).
- Angular has a template block for content that can arrive later, with triggers (`on viewport`,
  `on idle`...), a `prefetch` clause, and sub-blocks for what to show before and during the load.
  Think about layout shift.
- `PreloadAllModules` is a `PreloadingStrategy`. You can write your own and decide per route,
  for example from `route.data`.

</details>

<details><summary>Hint 3 - near the answer</summary>

`loadComponent: () => import('./catalog-pages').then(m => m.AdminToolsPage)`. In the handler:
`const { exportToCsv } = await import('./csv-export')`. In the template:
`@defer (on viewport; prefetch on idle) { <app-reviews-panel /> } @placeholder { <div class="reviews-placeholder"></div> } @loading (minimum 300ms) { ... }`.
For the preloading, implement `PreloadingStrategy` returning `load()` only when `route.data?.['preload']`
is true and mark the routes that deserve it.

</details>

---

Tests won't catch this one: some bundle-level effects cannot be seen from a unit test (for example,
a class that is referenced outside a `@defer` block, a heavy helper that is imported at the top of a
file although only a click handler needs it, or a barrel file, keeps a "lazy" thing in the main bundle). Check them with the build output: see `SOLUTION.md` on the `solutions` branch.
