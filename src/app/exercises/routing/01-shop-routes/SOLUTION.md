# L1 - Shop routes: solution

## What was wrong

1. **The wildcard route was not last.** The router matches `Routes` top to bottom and stops at the
   first match. `**` matches everything, so `checkout` and `account` (declared after it) were
   unreachable. Nothing fails at build time or at startup: the pages simply never render.
2. **`products/:id` was declared before `products/new`.** `/products/new` matched the parameterised
   route with `id = 'new'`, so the "Add a product" link opened a product page.
3. **The guard returned `false`.** `false` cancels the navigation and leaves the user wherever they
   were. On a cold load (a bookmark) that is a blank outlet.

## The fix

```ts
export const cartNotEmpty: CanActivateFn = () =>
  inject(CartState).count() > 0 || inject(Router).createUrlTree(['/products']);

export const SHOP_ROUTES: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductsPage },
  { path: 'products/new', component: NewProductPage },   // specific before parameterised
  { path: 'products/:id', component: ProductPage },
  { path: 'checkout', component: CheckoutPage, canActivate: [cartNotEmpty] },
  { path: 'account', component: AccountPage },
  { path: '**', component: NotFoundPage },               // always last
];
```

A guard can return `boolean | UrlTree | RedirectCommand` (sync, `Promise` or `Observable`). Returning
a `UrlTree` is the declarative way to say "not here, go there instead".

## Not planted, but worth knowing

`{ path: '', redirectTo: 'products' }` without `pathMatch: 'full'` is **not** a silent bug in
Angular 22: the router throws `NG04014` ("please provide 'pathMatch'") when the config is
processed. The default `prefix` matching of an empty path would match every URL, which is why
the router refuses to guess. Non-empty redirects (`{ path: 'old', redirectTo: 'products' }`) use
prefix matching, and the remaining segments are appended (`/old/5` becomes `/products/5`).

## Modern Angular takeaway

- Route order is behaviour. Review it like you review `if/else if` order: specific first,
  parameterised next, wildcard last.
- Functional guards (`CanActivateFn`) with `inject()` replaced class-based guards. They run in an
  injection context, but only synchronously: `inject()` after an `await` throws `NG0203`.

## What a reviewer should say in the PR comment

> The `**` route is declared before `checkout` and `account`, so they can never match, and
> `products/:id` shadows `products/new`. Order the routes specific -> parameterised -> wildcard.
> Also, `cartNotEmpty` returns `false` on denial, which leaves the user on a blank page; return a
> `UrlTree` so the router redirects to the product list.
