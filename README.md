# Angular Review Dojo

A practice repo for **Angular code-review challenges**: code that "works" but has bugs and bad practices, from basic to
advanced, on **Angular 22** (standalone, zoneless, signals, Vitest). It is written for someone coming back to Angular from
v19.

Each exercise is a small, realistic feature with defects you have to find and fix, a ticket written the way QA or a product
manager would report the symptom, three progressive hints, and a spec that describes the **correct** behaviour.

## Branches

| Branch | Contains |
|--------|----------|
| `main` | The exercises (broken code). Exercise specs are red on purpose; the base-app specs are green. |
| `solutions` | The same exercises fixed, plus `SOLUTION.md` in each folder. All specs green. |

## How to work an exercise

1. Pick one from the map below, or open the app (`npm start`) and use the index page.
2. Read its `TICKET.md`. It only describes the symptom.
3. **Find** the defects by reading the code. The tests are not your guide yet: run them after you have a theory.
4. **Fix** them on `main` (or on a branch of your own).
5. Run the exercise's spec until it is green:

   ```bash
   npm test -- --watch=false --include='src/app/exercises/<topic>/<NN-slug>/**/*.spec.ts'
   ```

   Other useful options: `--filter="part of a test name"` runs matching tests only; no `--include` runs everything.
6. Stuck? Open `HINTS.md` one hint at a time (nudge, area, near the answer).
7. Compare with the reference: `git diff main solutions -- src/app/exercises/<topic>/<NN-slug>`, and read `SOLUTION.md` there
   (`git show solutions:src/app/exercises/<topic>/<NN-slug>/SOLUTION.md`). Pay attention to **"What a reviewer should say in the
   PR comment"**: in a real review, naming the problem clearly is half the answer.

Some defects cannot be caught by a unit test (bundle size, a smell that renders the same HTML). Those exercises say so at the
bottom of `HINTS.md`: finding them is the point.

Testing exercises work differently: the defect is in the **tests** (a bug shipped although CI was green). `*.audit.spec.ts`
files describe the real requirement and are red on `main`; your job is to find out why the existing spec did not catch it.

`npm test -- --watch=false` on `main` fails only in exercise specs; on `solutions` it is fully green.

## Map of the exercises

L1 is basic, higher levels mix more defects. Folder: `src/app/exercises/<topic>/<NN-slug>/`.

### RxJS (`rxjs`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-list` | subscriptions and rendering in a zoneless app |
| L2 | `02-product-detail` | request races |
| L3 | `03-product-search` | search-box pipelines |
| L4 | `04-category-browser` | error handling and retries |
| L5 | `05-catalog-stats` | sharing and multicasting |
| L6 | `06-product-browser` | combining streams |
| L7 | `07-order-panel` | time, ordering, marble tests |
| L8 | `08-cart-store` | a reactive store |

### RxJS to Signals (`rxjs-to-signals`)

See also `src/app/exercises/rxjs-to-signals/README.md` (cheat sheet).

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-cart-service` | state in a service |
| L2 | `02-variant-picker` | derived and local state |
| L3 | `03-product-page` | routing data and loading state |
| L4 | `04-quick-search` | when RxJS is still the right tool |

### Routing (`routing`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-shop-routes` | route order, redirects, guard results |
| L2 | `02-product-pages` | reused components, input binding, resolvers |
| L3 | `03-admin-area` | lazy loading, `canMatch`, guard redirects |
| L4 | `04-account-area` | nested routes, relative navigation, child guards |
| L5 | `05-catalog-admin` | nested lazy routes, named outlets, route providers, titles, `canDeactivate` |

### Performance (`performance`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-grid` | `@for` tracking, work in templates |
| L2 | `02-order-summary` | OnPush, immutability, derived state |
| L3 | `03-product-spotlight` | zoneless pitfalls, `NgOptimizedImage`, `untracked` |
| L4 | `04-product-page` | lazy loading, `@defer`, bundles, preloading |

### Forms (`forms`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-profile-form` | typed reactive forms |
| L2 | `02-order-form` | `FormArray`, validators, `ControlValueAccessor` |
| L3 | `03-checkout-form` | Signal Forms |

### Directives (`directives`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-tooltip` | attribute directives, DOM access, cleanup |
| L2 | `02-has-role` | structural directives |
| L3 | `03-dialog-kit` | `hostDirectives`, focus management |

### Testing (`testing`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-stock-badge` | assertions that cannot fail |
| L2 | `02-place-order` | over-mocking, HTTP testing, timers |
| L3 | `03-cart-suite` | order-dependent and brittle suites |

### Change detection (`change-detection`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L0 | `00-playground` | not a bug hunt: interactive model + `EXPLAINER.md` |
| L1 | `01-order-lines` | OnPush and mutation |
| L2 | `02-page-header` | `ExpressionChangedAfterItHasBeenCheckedError` |
| L3 | `03-live-quote` | migrating a zone.js component |

### Memory and profiling (`memory`)

Start with `src/app/exercises/memory/GUIDE.md` (Chrome DevTools workflow).

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-viewport-info` | listeners and timers that outlive a component |
| L2 | `02-tile-registry` | retention through root services and caches |
| L3 | `03-sales-dashboard` | third-party widgets, long tasks, layout thrashing |

### Lifecycle (`lifecycle`)

See `src/app/exercises/lifecycle/README.md` (hook order, modern replacements).

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-badge` | inputs and hooks |
| L2 | `02-chart-frame` | view queries and DOM timing |
| L3 | `03-list-widgets` | inheritance and hooks, `async ngOnInit` |

## The shared domain

All exercises use the same small catalogue: products, categories, a cart and orders (`src/app/core/models.ts`), served by an
in-memory fake backend (`src/app/core/fake-backend.ts`, an `HttpInterceptorFn`, with ~150 ms latency; add `?fail=1` to a URL for
a 500). No real network is used.

## Angular 19 to 22: what changed that matters in a review

Only facts checked against the installed `@angular/*` 22.2.2 type definitions, source, or by running the exercises. Where a
claim comes from the Angular docs instead, it says so.

| Area | Angular 22 | Where you see it |
|------|------------|------------------|
| Change detection default | `OnPush` is the default. `ChangeDetectionStrategy.Eager` is the always-check strategy; `Default` is a deprecated alias of `Eager`. | Change detection playground |
| Zones | This app is zoneless: no zone provider, no zone.js. Plain fields written from timers/callbacks do not render. `NgZone` is a no-op (`NoopNgZone`). Dev mode warns (NG0914) if zone.js is loaded with zoneless. | Performance L3, Change detection L3 |
| Dev-mode checks | A second pass (`checkNoChanges`) runs in dev mode; with `OnPush` the same bug often becomes a silent stale view instead of NG0100. | Change detection L2 |
| Signal APIs | `input()`, `input.required()`, `output()`, `viewChild()`, `computed`, `linkedSignal`, `effect`, `afterNextRender`/`afterEveryRender`/`afterRenderEffect` with `earlyRead`/`write`/`mixedReadWrite`/`read` phases. | Lifecycle, Memory L3 |
| Resources | `rxResource({ params, stream })` (not `request`/`loader`), `httpResource(() => url, options)`. `resource.value()` **throws** in the error state: check `hasValue()`/`error()`. `whenStable()` waits for pending resources. | RxJS to Signals, Lifecycle L3 |
| Signal Forms | `@angular/forms/signals`: `form()`, `[formField]` directive, `form[formRoot]`, validators (`required`, `email`, `min`, `validate`, `validateAsync`, ...), `submit()`. Exports are tagged `@publicApi 22.0`. | Forms L3 |
| Router params | `paramsInheritanceStrategy` defaults to `'always'` (children see all parent params); the old behaviour is `'emptyOnly'`. | Routing L4 |
| Router bindings | `withComponentInputBinding()` binds path params, query params, static data **and resolver data** to inputs; a missing key sets the input to `undefined`. | Routing L2 |
| Router guards/resolvers | Guards return `boolean \| UrlTree \| RedirectCommand`; `ResolveFn` may return a `RedirectCommand`; `canMatch` runs before lazy loading. Not-`pathMatch` empty-path redirects throw `NG04014`. | Routing L1-L3 |
| Preloading | `withPreloading()` takes a strategy **class** (`Type<PreloadingStrategy>`). | Performance L4 |
| HTTP | `HttpClient` uses `fetch` by default. `HttpClientTestingModule` is deprecated: use `provideHttpClientTesting()`. | Testing L2 |
| Testing | Vitest through `@angular/build:unit-test` (`ng test`, `--include`, `--filter`). `vi.mock` of relative imports is not supported there. Un-awaited `expect(...).resolves/rejects` is reported as an error. `fixture.getDeferBlocks()` returns a Promise. | Testing, Performance L4 |
| `host` metadata | `host: { '(window:resize)': ... }` replaces `@HostListener`/`@HostBinding` and removes listeners for you (the Angular style guide prefers it). | Directives L1, Memory L1 |

## Project layout

```
src/app/core/                        shared domain, fake backend, API client
src/app/exercises/exercise-registry.ts   the list of exercises (drives the index page and the lazy routes)
src/app/exercises/<topic>/<NN-slug>/     TICKET.md, HINTS.md, code, spec (+ SOLUTION.md on `solutions`)
odd/tasks/angular-review-dojo.md     the plan and the evidence behind this repo
```

Some routing exercises build their own router inside the exercise folder; open them from the index page, but the specs are
the faithful way to run them (a few redirects inside them use absolute URLs that only make sense when the routes are mounted at
the root, as the specs do).
