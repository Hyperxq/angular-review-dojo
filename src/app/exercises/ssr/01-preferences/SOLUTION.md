# L1 - Preferences panel: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | Field initializers read `localStorage` and `window` while the component is constructed, which also happens on the server. | **blocking** |
| 2 | The constructor writes `document.title` and `document.documentElement` through the global. | **blocking** |
| 3 | The initial state depends on the browser (stored theme, width), so server HTML and first client render would differ. | should-fix |
| 4 | `window.addEventListener`-style access in handlers is fine at runtime but untestable and not SSR-safe if reused. | nit |

## Why

Server rendering runs the component class in Node: there is no `window`, `localStorage` or `matchMedia`; the DOM it
renders into is a server DOM provided through the `DOCUMENT` token. Constructors and field initializers run on both
platforms, so they must be platform-neutral. Code that needs the browser belongs in a hook that only runs there:
`afterNextRender` / `afterEveryRender` are skipped during server rendering (verified: with `PLATFORM_ID = 'server'` the
callback never runs). Event handlers only fire in the browser, so touching globals there is safe.

## The fix

```ts
protected readonly dark = signal(false);                 // same on server and first client render
protected readonly width = signal<number | null>(null);
constructor() {
  inject(Title).setTitle('Preferences');                  // works on both platforms
  afterNextRender(() => { /* read localStorage / matchMedia / innerWidth */ });
}
```
Use `inject(DOCUMENT)` for the document and `document.defaultView` for the window.

## What the tests can and cannot prove

The specs simulate the server with `PLATFORM_ID: 'server'` and by stubbing `window`, `localStorage` and
`sessionStorage` to `undefined` (`src/app/core/server-env.ts`). That catches "touches the global too early". It does
**not** run a server renderer (`@angular/platform-server` is not installed here), and `document` stays available because
the TestBed itself needs it, so a stray `document.title = ...` is a review finding, not a failing test. Hydration
mismatches are not detectable this way (see L2).

## Tradeoffs and discussion

- **`afterNextRender` vs. `isPlatformBrowser`:** `afterNextRender` also expresses *when* (after the first paint, so it
  never delays it) and gives you a safe place for DOM measurement. `isPlatformBrowser` is better for synchronous logic that
  must choose a branch (for example picking a storage implementation in a provider factory).
- **Flash of wrong theme:** reading the theme only after render means a light page flashes before switching to dark. The
  robust fix is a cookie read on the server (theme in the first byte) or a tiny inline script, a product/perf decision.

## What a reviewer should say in the PR comment

> **Blocking:** `localStorage`/`window` are read in field initializers, which run during SSR (`window is not defined`).
> Start from neutral defaults and move browser reads into `afterNextRender`. **Blocking:** use `Title`/`DOCUMENT` instead
> of the `document` global. *Question:* do we accept a flash of light theme on first paint, or should the server get the
> preference from a cookie?
