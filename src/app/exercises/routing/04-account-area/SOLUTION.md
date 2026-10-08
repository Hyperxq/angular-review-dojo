# L4 - Account area: solution

## What was wrong

1. **`OrdersPage` has child routes but no `<router-outlet />`.** The router activated the child
   component but had nowhere to put it. Any component that appears as a parent in `children` needs
   an outlet (a named one, if the child uses `outlet: 'name'`).
2. **`routerLink="['/orders', id]"` is absolute.** A leading `/` starts from the root of the whole
   app, ignoring the `/account/:customerId` prefix. Without it the link is relative to the route of the
   component that renders it: `[order.id]` inside `OrdersPage` resolves to `orders/<id>`.
3. **`router.navigate(['orders'])` without `relativeTo`.** `Router.navigate` has no
   current-route context by default, so it resolves from the root. `routerLink` does have one
   (the injected `ActivatedRoute`), which is why links are the better tool when you can use them.
   Fix: `router.navigate(['..'], { relativeTo: this.route })`.
4. **`canActivate` on a route with children.** `canActivate` runs when the route is *activated*.
   Moving between its children (`orders` -> `profile`) keeps the parent active, so the guard
   does not run again. `canActivateChild` runs for every navigation to any child.

## The fix

```ts
canActivateChild: [signedIn]   // with CanActivateChildFn
```
```html
<a [routerLink]="[order.id]">Order #{{ order.id }}</a>
<router-outlet />
```
```ts
this.router.navigate(['..'], { relativeTo: this.route });
```

## Not planted: "the child cannot see the parent's params"

On Angular 19 the default `paramsInheritanceStrategy` was `'emptyOnly'`: a child only inherited
its parent's params when it had an empty path or the parent had no component, which led to the classic
"read `route.parent.params`" workaround. In the installed Angular 22 router types the default is
`'always'` (the docs say: "By default ('always'), a route inherits all parameters from its parent
routes"; the legacy behaviour is `withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' })`).
That is why `OrdersPage` can bind `customerId` with a plain `input()` here. If you see code that
walks `route.parent` for params, it is probably a v19 leftover.

## Modern Angular takeaway

- Relative by default, absolute on purpose. Links and `navigate` inside a feature should not
  know the URL prefix the feature is mounted on.
- `canActivateChild` / `canMatch` / `canActivate` are not interchangeable: know when each one runs.

## What a reviewer should say in the PR comment

> `OrdersPage` declares child routes but has no `<router-outlet />`, so the detail never renders.
> The `/orders/...` link and the `navigate(['orders'])` call are resolved from the root: use a relative
> `routerLink` and `navigate([...], { relativeTo })`. And the sign-in check must be
> `canActivateChild`; `canActivate` on the parent only runs once, when the area is entered.
