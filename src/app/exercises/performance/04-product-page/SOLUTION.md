# L4 - Product page loading: solution

## What was wrong

1. **`component: AdminToolsPage` with a static import.** A route's `component` must exist when
   the route file is evaluated, so it lands in the same chunk. `loadComponent: () => import(...)`
   (or `loadChildren` for a group of routes) turns the page into its own chunk, fetched on first
   navigation.
2. **The reviews panel was rendered eagerly.** Below-the-fold content that is not needed for the first
   paint belongs in a `@defer` block. The fix uses `on viewport` (when the placeholder scrolls into
   view) plus `prefetch on idle` (download the code when the browser is idle, so it is usually
   ready by the time the user gets there), and:
   - `@placeholder` with a **fixed minimum height**, otherwise the page jumps when the content
     arrives (layout shift hurts CLS);
   - `@loading (minimum 300ms)` so a fast load does not flash a spinner;
   - `@error` so a failed chunk download is visible.
   With `on viewport` and no explicit reference, the **placeholder is the element being observed**,
   which is why it must be a single root element.
3. **`viewChild(ReviewsPanel)` kept the component in the main chunk.** For a component in `imports`
   that is only used inside `@defer` blocks, the compiler replaces the static `import` with a dynamic one.
   It can only do that when nothing else in the file references the class. A `viewChild(ReviewsPanel)` is
   such a reference, so the static import stayed and the "deferred" panel remained in the main bundle. The fix queries a template reference variable on an anchor element instead.
4. **A heavy helper imported at the top of the component** (`csv-export.ts`, which also does
   work when evaluated) is always in the component's chunk. The click handler awaits
   `import('./csv-export')`, so it is downloaded only when somebody exports.
5. **`import { SHELL_LINKS } from './index'`.** A barrel that re-exports everything drags the whole
   graph behind it into whoever imports it, because bundlers must keep modules with top-level side
   effects (`csv-export` computes a table when evaluated). That silently undid items 1 and 4 for the
   shell. Import from the module that defines what you need.
6. **`PreloadAllModules`** downloads every lazy route right after startup, including the finance-only
   reports. The `SelectivePreloading` strategy preloads only routes flagged with
   `data: { preload: true }` (checkout, the likely next step).

## How to confirm the bundle effects yourself (tests cannot see 3, 4 and 5)

Run `ng build --stats-json` (this repo does not build it for you) and open `dist/.../stats.json`
in an analyzer such as esbuild's bundle size analyzer (https://esbuild.github.io/analyze/), or look at the
lazy chunk list printed by the build. Before the fix `csv-export` and `reviews-panel` appear in the
initial chunk; after the fix they are separate lazy chunks.

## Tradeoffs for the preloading choice

| Strategy | Pro | Con |
|----------|-----|-----|
| none (default) | zero extra traffic | every first navigation waits for its chunk |
| `PreloadAllModules` | simplest, instant navigation | downloads everything, even for users who never go there; bad on metered networks |
| selective via `route.data` | pay only for the likely next page | you must maintain the flags; wrong flags = wasted bytes or slow pages |
| network-aware (`navigator.connection`) | respects Save-Data | not available in every browser; more code |

## Modern Angular takeaway

- Lazy by default for everything that is not the first screen: `loadComponent`, `loadChildren`, `@defer`.
- `@defer` has triggers, `prefetch`, and three companion blocks; always design the placeholder to
  keep the layout stable.
- Anything that references a class from outside the deferred block (decorators, `viewChild`,
  injection tokens, barrels) defeats the split.

## What a reviewer should say in the PR comment

> The reviews panel and the CSV helper are in the initial bundle. Wrap the panel in
> `@defer (on viewport; prefetch on idle)` with a sized placeholder, drop the `viewChild(ReviewsPanel)`
> reference (it prevents the split), and `import()` the CSV helper in the handler. `admin` should be
> `loadComponent`, the shell should not import the barrel, and `PreloadAllModules` will pull the
> reports chunk for everyone; flag the routes that matter and preload only those.
