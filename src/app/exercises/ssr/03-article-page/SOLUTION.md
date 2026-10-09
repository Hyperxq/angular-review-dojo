# L3 - Article page: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | The Like button is inside `@defer (hydrate never)`: that block stays static server HTML forever, so it never gets event listeners. | **blocking** |
| 2 | `host: { ngSkipHydration: 'true' }` on `Comments` hides a hydration error instead of fixing it: the subtree is thrown away and rebuilt in the browser (the flash, the extra work, the lost benefit of SSR). | **blocking** |
| 3 | The real cause of that mismatch was `Date.now()` during the first render, which differs between server and browser. | **blocking** |
| 4 | `Comments` is a presentational list that does its own time arithmetic; fine, but it should not need a global clock in the template path. | nit |

## Why

- **Hydration triggers** (`@defer (hydrate on ...)`) decide *when* server-rendered deferred content becomes interactive:
  `idle`, `viewport`, `interaction`, `hover`, `immediate`, `timer(...)`, `when <expr>`, or `never`. `never` means "this
  content is static for the life of the page": perfect for a legal footer, wrong for a button. (The compiler also rejects
  combining `hydrate never` with any other hydrate trigger.)
- In Angular 22 `provideClientHydration()` enables incremental hydration by default (`withIncrementalHydration()` is
  deprecated; `withNoIncrementalHydration()` opts out). Verified in the source: incremental hydration is registered together with event
  replay, so the click that triggers `hydrate on interaction` is replayed once the block is hydrated.
- `ngSkipHydration` is for components that cannot hydrate (third-party DOM manipulation you do not control). Used on your
  own component to silence NG05xx errors it throws away the benefit and the symptom (the mismatch) comes back as flicker.

## The fix

```html
@defer (hydrate on interaction) { <app-reaction-bar [initial]="12" /> }
```
```ts
protected readonly now = signal<number | null>(null);
constructor() { afterNextRender(() => this.now.set(Date.now())); }   // template: @if (now(); as time) { ... }
```
and `host: { ngSkipHydration: 'true' }` is deleted.

## What the tests can and cannot prove

They prove: no element carries `ngSkipHydration`; with `ngServerMode` on, two renders at different times produce identical
HTML; in the browser the times appear after the first render; and a text scan (a stand-in for a lint rule) refuses
`<app-reaction-bar>` inside a `hydrate never` block. They cannot prove that hydration succeeds, that the block hydrates
on interaction, or that the replayed click is delivered: that needs a real SSR run (`@angular/ssr`) and a browser.

## Tradeoffs and discussion

- **`interaction` vs. `viewport` vs. `idle`:** `interaction` defers the JavaScript until the first click (best for rarely used
  widgets, the click is replayed, the user sees a small delay). `viewport` hydrates when scrolled into view, `idle` when
  the browser is idle; choose by how likely the interaction is and how big the code is.
- **Cost of `never`:** zero JavaScript for that subtree, which is great for large static regions; it also means no
  listeners, no bindings that react to state.

## What a reviewer should say in the PR comment

> **Blocking:** the Like button sits in `@defer (hydrate never)`, so it will never be interactive; use
> `hydrate on interaction` (event replay covers the first click). **Blocking:** `ngSkipHydration` on `Comments` is hiding
> the error, not fixing it; the cause is `Date.now()` in the first render. Start with no time and set it in
> `afterNextRender`. *Question:* do we have a real SSR run in CI that would catch NG05xx errors?
