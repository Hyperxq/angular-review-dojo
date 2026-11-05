# L5 - Catalog admin: solution

## What was wrong

1. **`providers: [DraftStore]` on each tab route.** `Route.providers` creates an *environment
   injector for that route*. Two sibling routes that both list `DraftStore` get two instances, so
   the name typed on General never reached Pricing. (Each tab's copy outlives the tab switch: the
   route injector is cached on the `Route` and, by default, is not destroyed when the user leaves.
   That is why General still shows the name when you come back.) State shared by
   several routes belongs on the closest common **parent** route (here the one with
   `component: ProductsLayout`): the children's injectors are children of it.
2. **`confirmLeave` always called `confirm()`, on the wrong route.** It sat on the `general` tab
   route, so it fired when merely switching to Pricing, although the draft is shared and nothing
   is lost. `canDeactivate` runs for the route being left: on the parent (`ProductsLayout`) it only
   runs when the user leaves the whole editor. And a `canDeactivate` guard must first decide
   whether there is anything to lose. The store already exposes `dirty()` (and `save()` resets it), so
   the guard only needs to read it: `!inject(DraftStore).dirty() || confirm(...)`.
   (Guards run in an injection context, so `inject()` works, synchronously.)
3. **Named outlet mismatch.** Three strings must agree: the `outlet: 'aside'` in the route, the
   `{ outlets: { aside: [...] } }` in the link and the `name` of the `<router-outlet>`. The template
   said `name="help"`, so the router happily activated the route and had no outlet to put it in
   (no error, nothing rendered).
4. **`TitleStrategy.buildTitle()` returns `string | undefined`.** Interpolating it blindly produced
   "undefined | Admin" for every route without a `title`.

## The fix

```ts
// products.routes.ts
{ path: '', component: ProductsLayout, providers: [DraftStore], canDeactivate: [confirmLeave], children: [...] }
const confirmLeave: CanDeactivateFn<ProductsLayout> = () =>
  !inject(DraftStore).dirty() || confirm('You have unsaved changes. Leave anyway?');
```
```html
<aside><router-outlet name="aside" /></aside>
```
```ts
const pageTitle = this.buildTitle(snapshot);
this.title.setTitle(pageTitle ? `${pageTitle} | Admin` : 'Admin');
```

## Things worth knowing (verified in the router source and types)

- The title is taken from the deepest primary route that has one. Parents act as fallback, so a
  `title` on a layout route covers its untitled children.
- `canDeactivate` runs for the *route being left*. On a parent route it does not fire when
  switching between child tabs.
- A route's `title` can also be a `ResolveFn<string>` for dynamic titles.
- A route's `providers` injector is created the first time the route is activated and cached on
  the `Route`. It is not destroyed when the user navigates away unless the app opts in with
  `provideRouter(routes, withAutoCleanupInjectors())` (the default `RouteReuseStrategy` then allows
  it). This app does not opt in, so after the fix the draft also survives leaving the editor and
  coming back. If every visit must start with an empty draft, give it a component owner instead:
  `providers: [DraftStore]` on `ProductsLayout` (the tabs render inside its outlet, so they still
  resolve it), and it is destroyed with the layout.

## Modern Angular takeaway

- Route-level `providers` are the scoped alternative to `providedIn: 'root'`: they control who
  shares an instance (the route's subtree), not how long it lives. By default the instance is
  created on first entry and kept after the user leaves. For a per-visit lifetime, provide it on
  a component that owns the visit, or opt in to `withAutoCleanupInjectors()`.
- Guards return decisions; decide first, only then interact with the user.

## What a reviewer should say in the PR comment

> `DraftStore` is provided on each tab route, so every tab gets its own instance and the draft is
> lost on switch: provide it once on the parent route. The leave guard prompts even when nothing
> changed; check `dirty()` first. The aside outlet is named `help` in the template but `aside` in
> the route and link. `buildTitle()` can be `undefined`, so the title strategy needs a fallback.
