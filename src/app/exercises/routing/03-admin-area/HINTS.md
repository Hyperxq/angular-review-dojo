# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

All four symptoms come from the guard and the two routes it protects. Follow one navigation to
`/admin/users` step by step: when is the URL matched, when is the lazy code loaded, when does the
guard run, and what does the guard hand back to the router?

</details>

<details><summary>Hint 2 - area</summary>

- The router loads `loadChildren` while it matches the URL. Does `canActivate` run before or after
  that? Which guard type runs early enough to stop the download?
- While a guard runs, the navigation is still in progress. What does `router.url` contain at that
  moment? What does the guard receive about the target URL?
- A guard that calls `router.navigate()` and returns `false` rejects the navigation. What can a guard
  return so the router treats it as a redirect instead?
- `component: ReportsPage` imports the page into the routes file. What is the lazy equivalent for a
  single component?

</details>

<details><summary>Hint 3 - near the answer</summary>

Turn `adminGuard` into a `CanMatchFn` and use it as `canMatch` on both `admin` and `reports`. Build
the return URL from the `segments` argument, and return
`router.createUrlTree(['/login'], { queryParams: { returnUrl } })` or
`router.createUrlTree(['/forbidden'])` instead of navigating and returning `false`. Replace
`component: ReportsPage` with `loadComponent`.

</details>
