# L2 - News feed: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `withNoHttpTransferCache()` turns off the cache that carries server responses to the browser: every request is made twice. | **blocking** (perf regression the rollout was meant to remove) |
| 2 | `new Date()` and `Math.random()` run during the first render: server and browser compute different values, so the DOM no longer matches (and the page flickers). | **blocking** |
| 3 | `<table><tr>` without `<tbody>`: the HTML parser inserts `<tbody>` when the browser parses the server HTML, so the tree differs from what Angular expects (NG0500/NG0501). | **blocking** |
| 4 | `PromoBanner` edits its own DOM with `insertAdjacentHTML` in `ngOnInit`: DOM changed outside Angular's knowledge. | should-fix (invisible in unit tests) |
| 5 | A computed that calls `Math.random()` is impure: it only "works" because it re-runs rarely. | nit |

## Why

Hydration reuses the server DOM instead of rebuilding it, matching nodes to the template **by structure**. Anything that makes
the first client render differ from the server HTML breaks the match:

- non-deterministic input (time, randomness, `window` sizes, `localStorage`), fixed by rendering a neutral value and
  updating after hydration with `afterNextRender`;
- markup the HTML parser reshapes (`<p><div>`, `<table><tr>`, nested `<a>`/`<form>`), fixed by valid HTML;
- DOM manipulation outside Angular (direct `innerHTML`, `insertAdjacentHTML`, third-party widgets that move nodes), fixed by
  rendering in the template, or by doing it in `afterNextRender` for browser-only widgets.

Angular 22 facts (verified in the installed types/source): `provideClientHydration()` enables the HTTP transfer cache and
incremental hydration **by default**; `withNoHttpTransferCache()` opts out; `withHttpTransferCacheOptions({...})` customizes
it (`includeHeaders`, `includePostRequests`, `filter`, ...). By default the cache **skips requests with `Authorization`,
`Cookie` or `withCredentials`**, so an authenticated feed is fetched twice unless you opt in with
`includeRequestsWithAuthHeaders` (and think about what that means for private data in the page source). The server only
stores a response when `ngServerMode` is true; the cache stops answering once the app is stable.

## The fix

```ts
provideClientHydration()                      // transfer cache on
now = signal<Date | null>(null);              // set in afterNextRender
<table><tbody>@for (...) { <tr>...</tr> }</tbody></table>
<p class="promo">... <span class="badge">New</span></p>
```

## What the tests can and cannot prove

- `PLATFORM_ID = 'server'` does **not** make `afterNextRender` skip: Angular decides from the `ngServerMode` global
  (a compile-time define in real builds). `src/app/core/server-env.ts#enterServerMode` stubs it so specs behave like a server.
- "Same HTML for different clocks/randoms" proves determinism of the first render, not that hydration succeeds.
- The parse-again test (`innerHTML` out, `innerHTML` in) catches elements the HTML parser reshapes; it is a good, cheap proxy.
- The transfer-cache test runs the server phase and the browser phase in one process, handing over `TransferState.toJson()`
  through a `<script id="<APP_ID>-state">` element (the TestBed `APP_ID` is not `ng`, so the spec provides its own).
- Only a real SSR run (with `@angular/ssr`) and the browser console show NG0500-series errors. Finding #4 stays a review item.

## Tradeoffs and discussion

- **Updating after hydration vs. deterministic values:** a "last updated" time can be rendered by the server and reused if you
  pass the timestamp through the data (it is then deterministic). Random content should be chosen on the server and
  transferred (`TransferState`), not recomputed.
- **`ngSkipHydration`** would also make the errors disappear; see L3 for why that is a band-aid.

## What a reviewer should say in the PR comment

> **Blocking:** `withNoHttpTransferCache()` makes every request run on both sides; remove it (or customize with
> `withHttpTransferCacheOptions`). **Blocking:** the first render uses `new Date()` and `Math.random()`, so server and client
> disagree: start neutral and set them in `afterNextRender`. **Blocking:** add `<tbody>`, the parser reshapes the table.
> *Should-fix:* `PromoBanner` mutates its DOM in `ngOnInit`; put the badge in the template.
