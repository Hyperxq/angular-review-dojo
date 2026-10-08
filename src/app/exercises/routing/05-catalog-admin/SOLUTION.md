# L5 - Catalog admin: solution

## What was wrong

1. **`providers: [DraftStore]` on each tab route.** `Route.providers` creates an *environment
   injector for that route*. Two sibling routes that both list `DraftStore` get two instances, and
   each is destroyed with its route, so the draft was lost on every tab switch. State shared by
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

## Modern Angular takeaway

- Route-level `providers` are the scoped alternative to `providedIn: 'root'`: shared by a
  subtree, created on entry, destroyed on exit. Put them at the right level of the tree.
- Guards return decisions; decide first, only then interact with the user.

## What a reviewer should say in the PR comment

> `DraftStore` is provided on each tab route, so every tab gets its own instance and the draft is
> lost on switch: provide it once on the parent route. The leave guard prompts even when nothing
> changed; check `dirty()` first. The aside outlet is named `help` in the template but `aside` in
> the route and link. `buildTitle()` can be `undefined`, so the title strategy needs a fallback.
