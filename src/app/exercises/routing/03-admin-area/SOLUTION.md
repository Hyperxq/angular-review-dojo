# L3 - Admin area: solution

## What was wrong

1. **`canActivate` on a lazy route.** The router resolves `loadChildren` while it recognises the
   URL, **before** `canActivate` runs. Every signed-out visitor who typed `/admin` still downloaded
   the whole admin bundle, only to be turned away. `canMatch` runs *before* the lazy load and,
   when it fails, makes the route not match at all.
2. **`router.url` used as the return URL.** Inside a guard, the navigation is still in flight, so
   `router.url` is the page the user is coming *from*. After signing in they landed on the wrong
   page. The target is available to the guard itself: `state.url` in `canActivate`, or the
   `segments` argument in `canMatch`.
3. **`router.navigate()` inside a guard, then `return false`.** The guard starts a second
   navigation by hand and rejects the first one (`NavigationCancel` with code `GuardRejected`).
   It looks fine on screen, but the router cannot tell "denied" from "redirected": events, analytics
   and `navigateByUrl()`'s result all report a rejection, and the redirect races with the original
   navigation. A guard should *describe* the redirect by returning a `UrlTree` (or a
   `RedirectCommand`); the router then cancels with code `Redirect` and replaces the navigation.
4. **`reports` imported eagerly.** `component: ReportsPage` puts the page in the main bundle even
   though only admins see it. `loadComponent` makes it a separate chunk.

## The fix

```ts
export const adminGuard: CanMatchFn = (_route, segments) => {
  const user = inject(Session).user();
  const router = inject(Router);

  if (!user) {
    const returnUrl = '/' + segments.map((s) => s.path).join('/');
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
  if (user.role !== 'admin') {
    return router.createUrlTree(['/forbidden']);
  }
  return true;
};

{ path: 'admin', canMatch: [adminGuard], loadChildren: () => import('./admin/admin.routes').then(...) },
{ path: 'reports', canMatch: [adminGuard], loadComponent: () => import('./area-pages').then(...) },
```

(`CanMatchFn` signature in Angular 22: `(route, segments, currentSnapshot) => MaybeAsync<GuardResult>`,
where `GuardResult = boolean | UrlTree | RedirectCommand`.)

## Caveat

`canMatch` only decides whether the route *matches*: if the guard returns `false`, the router keeps
trying later routes (and may end on the wildcard). That is why the guard returns a `UrlTree`.
`canMatch` also does not re-run for a route that is already active, so for "log out while on the
page" scenarios keep a `canActivate`/`canActivateChild` too, or navigate away on sign-out.

## Modern Angular takeaway

- Gate lazy features with `canMatch`, not `canActivate`.
- Guards return values (`boolean | UrlTree | RedirectCommand`); they do not navigate.
- Everything the guard needs to know about the target navigation is passed in.

## What a reviewer should say in the PR comment

> This guard is a `canActivate` on a lazy route, so the admin chunk is downloaded before the
> check; use `canMatch`. It also calls `router.navigate()` and returns `false` instead of returning
> a `UrlTree`, which makes the router report a rejection instead of a redirect, and `router.url` is the previous page, not the
> requested one (use the `segments`/`state.url` argument). `reports` should be `loadComponent`.
