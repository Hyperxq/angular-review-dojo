# L3 - Order tracker: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | No focus management on route changes: in a single-page app nothing announces a new page and keyboard focus stays on a link that may no longer exist. | **blocking** |
| 2 | Routes have no `title`: the tab title (and the first thing a screen reader announces on a new page) never changes. | **blocking** |
| 3 | Filtering updates the list silently: no live region. | should-fix |
| 4 | Status shown only as a coloured dot (WCAG 1.4.1 Use of Color); the dot is not hidden from assistive technology either. | **blocking** |
| 5 | Moving focus on the *initial* load would steal focus from the browser; this solution moves it on every `NavigationEnd`, including the first. | nit |

## Why

A real page load makes the browser reset focus, announce the new `<title>` and start reading from the top. With the router
none of that happens. The standard recipe is: a unique `<title>` per route (`title` on the route, or a `TitleStrategy`), and move
focus to the start of the new content (the `main` landmark with `tabindex="-1"`, or the page `h1`) after the new view is in
the DOM, hence `afterNextRender`. Live regions announce **changes** to content that already exists in the DOM, which is why the
`role="status"` paragraph is part of the first render and only its text changes.

## The fix

```ts
{ path: 'help', component: OrderHelp, title: 'Help' }
{ path: ':id', component: OrderDetail, title: (route) => `Order ${route.paramMap.get('id')}` }
```
```ts
router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
  .subscribe(() => afterNextRender(() => this.main().nativeElement.focus(), { injector }));
```
```html
<main #main tabindex="-1"> ...
<p role="status">{{ count }} orders shown</p>
<span class="dot" aria-hidden="true"></span> <span class="status">Shipped</span>
```

## What the tests can and cannot prove

They check where `document.activeElement` ends up, the `Title`, the live region text and the markup of the status. They cannot
tell how NVDA, JAWS or VoiceOver announce a route change (some read the title, some the heading, some nothing). Contrast of the
dot against the background (3:1) and high-contrast mode need a visual tool.

## Tradeoffs and discussion

- **Focus `main` vs. the `h1`:** the heading gives the screen reader a precise starting point; `main` is a catch-all that
  works without every page having an `h1`. Some teams use a "skip to content" target for the same purpose.
- **Should the initial load move focus?** Usually not. Skip the first `NavigationEnd` in production code
  (`pairwise`/a flag) so the browser's own handling wins.
- **`aria-live` on the whole list** would read the entire list every time; a short summary line is kinder.

## What a reviewer should say in the PR comment

> **Blocking:** route changes don't announce or move focus, and routes have no titles. Add `title` and move focus to `main`
> (or the `h1`) after `NavigationEnd` using `afterNextRender`. **Blocking:** the status is colour-only: add the text and
> hide the dot. *Should-fix:* announce the filter result in a polite live region. *Nit:* don't move focus on the very
> first navigation.
