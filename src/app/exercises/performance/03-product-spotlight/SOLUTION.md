# L3 - Product spotlight: solution

## What was wrong

1. **Plain fields changed from a timer and from browser events.** The app is zoneless and the
   component is OnPush. Without zone.js nothing patches `setTimeout` or `addEventListener` to
   say "something may have changed"; Angular only re-renders a view when a signal it reads
   changes, a template/host event listener of that view fires, an `async` pipe emits, `markForCheck()`
   is called, or `ComponentRef.setInput` is used. Assigning `this.promoVisible = false` from a timer
   does none of these. (With zone.js the same code "worked" because every timer and event
   triggered a global change detection, which hides the bug until you go zoneless.)
2. **`window.addEventListener` in the constructor, never removed.** Every instance of the
   component adds two listeners that outlive it, and each keeps the destroyed component alive.
3. **The hero image was a plain `<img>`.** `NgOptimizedImage` (`ngSrc` + `width`/`height` +
   `priority`) sets `fetchpriority="high"` and `loading="eager"` on the LCP image, and warns in
   dev mode if the size is missing. Without it the browser discovers and prioritises the image late.
4. **The `effect` read `cart.count()`.** An effect re-runs when any signal it *reads* changes, and
   reading in the argument list counts. The analytics call re-fired on every cart change.

## The fix

```ts
protected readonly promoVisible = signal(true);
protected readonly online = signal(true);
// host: { '(window:offline)': 'online.set(false)', '(window:online)': 'online.set(true)' }

const promoTimer = setTimeout(() => this.promoVisible.set(false), 3000);
inject(DestroyRef).onDestroy(() => clearTimeout(promoTimer));

effect(() => {
  const productId = this.product().id;
  untracked(() => this.analytics.track('spotlight_view', { productId, cartSize: this.cart.count() }));
});
```
```html
<img ngSrc="spotlight-hero.jpg" alt="..." width="1200" height="600" priority />
```

`host` listeners like `(window:offline)` are added and removed by the framework with the
component's lifecycle, and they mark the view dirty, so no manual cleanup is needed.

## Modern Angular takeaway

- Zoneless means "state that the template reads must be a signal" (or go through
  `markForCheck`/`async`). Plain fields assigned in callbacks are the number one porting bug.
- `untracked()` is how you read a signal inside an effect/computed without subscribing to it.
- Keep `effect`s for side effects only, and make their dependencies explicit.

## What a reviewer should say in the PR comment

> The component is OnPush and the app is zoneless, so `promoVisible`/`online` assigned from a timer and
> from `window` events never reach the view: make them signals. The `window` listeners are never
> removed (use `host` listeners), the LCP image should be `NgOptimizedImage` with `priority`, and
> the analytics effect tracks `cart.count()` so it fires on every cart change; read it in `untracked`.
