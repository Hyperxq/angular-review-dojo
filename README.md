# Angular Review Dojo

A practice repo for **Angular code-review challenges**: code that "works" but has bugs and bad practices, from basic to
advanced, on **Angular 22** (standalone, zoneless, signals, Vitest). It is written for someone coming back to Angular from
v19.

Each exercise is a small, realistic feature with defects you have to find and fix, a ticket written the way QA or a product
manager would report the symptom, three progressive hints, and a spec that describes the **correct** behaviour.

The dojo has two parts:

- **Part 1: framework mechanics** (RxJS, signals, routing, performance, forms, directives, testing, change detection, memory,
  lifecycle). Defects you can usually *prove* with a test.
- **Part 2: staff level** (security, SSR and hydration, accessibility, state at scale, DI architecture, HTTP and error architecture,
  feature architecture, and a capstone that simulates reviewing a pull request). The point is no longer only to find the bug but to
  **say how bad it is, why, and what you would ask for**. Each `SOLUTION.md` in Part 2 lists a severity (blocking / should-fix /
  nit / question) per finding and the tradeoff discussion; the capstone has a full model review.

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

## Map of the exercises: Part 1 (framework mechanics)

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

## Map of the exercises: Part 2 (staff level)

The index page groups these under "Part 2: staff level". Dependencies added for Part 2: `@ngrx/signals` (SignalStore). SSR is exercised
without a server: specs set `PLATFORM_ID` to `'server'`, set the `ngServerMode` global and hide `window`/`localStorage` (see `src/app/core/server-env.ts`);
accessibility specs use a small role/name query helper (`src/app/core/a11y-queries.ts`); the architecture track scans the source files'
imports (`src/app/core/architecture-rules.ts`).

### Security (`security`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-reviews` | `bypassSecurityTrust*` on user content, `javascript:` links, open redirect |
| L2 | `02-api-client` | token sent to third parties, XSRF protection disabled, PII and secrets in logs, token storage |
| L3 | `03-content-studio` | `innerHTML` via `ElementRef`, markdown to HTML, building trusted HTML by concatenation, file path in a URL |

### SSR and hydration (`ssr`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-preferences` | browser globals on the server, `afterNextRender`, `DOCUMENT`, `Title` |
| L2 | `02-news-feed` | hydration mismatches (time, randomness, invalid HTML, DOM edits), HTTP transfer cache |
| L3 | `03-article-page` | `ngSkipHydration` as a band-aid, `@defer (hydrate ...)` triggers |

### Accessibility (`a11y`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-product-rows` | clickable `div`s, accessible names, labels, focus outline |
| L2 | `02-filter-widgets` | listbox keyboard pattern, modal dialog focus, announced errors |
| L3 | `03-order-tracker` | focus and title on route change, live regions, colour-only status |

### State at scale (`state`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-cart-widgets` | derived vs stored state, snapshot vs live read, read-only exposure |
| L2 | `02-product-store` | SignalStore: mutation in `patchState`, copies of entities, effects that derive state |
| L3 | `03-checkout-stores` | optimistic updates, rollback, races between stores, ownership of state |

### DI architecture (`di`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-quantity-steppers` | `@Service()` scope (`autoProvided: false`), component `providers`, `inject()` outside a context |
| L2 | `02-signup-feature` | `InjectionToken` defaults, `multi: true`, `useClass` vs `useExisting` |
| L3 | `03-reports-area` | route-level `providers`, `provideHttpClient` in a lazy route, duplicate singletons |

### HTTP and error architecture (`http-errors`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-catalog-page` | swallowed errors, resources and error state, global `ErrorHandler` |
| L2 | `02-orders-client` | interceptor order, retry policy, `defer` and re-subscription, idempotency |
| L3 | `03-token-refresh` | concurrent 401s, shared refresh, replay, cancel on logout |

### Feature architecture (`architecture`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-order-summary` | smart/dumb components, business rules in templates |
| L2 | `02-boundaries` | public APIs per feature, dependency direction, a fitness-function spec |
| L3 | `03-shop` | a god service, folders by type, refactoring to features (ADR in `SOLUTION.md`) |

### Capstone (`capstone`)

| Level | Exercise | Focus |
|-------|----------|-------|
| L1 | `01-price-alerts` | **review a pull request**: `PR.md` + about 400 lines of code mixing Part 1 and Part 2 defects; `REVIEW.md` on `solutions` |

Capstone rules: the specs only cover the four **blocking** issues. Write your review first (blocking / should-fix / nit / question, ordered, with the
"looks wrong but is fine" items identified), then compare with `REVIEW.md`.

## Staff review rubric

Review in this order; stop to write a comment whenever something earns it, but keep the order in your head:

1. **Correctness:** does it do what it claims, including failures, races and edge cases? (stale results, duplicates, lost updates, error paths)
2. **Security:** untrusted data into sinks (`innerHTML`, URLs, `bypassSecurityTrust*`), credentials leaving the app, CSRF, logs, redirects.
3. **Architecture and maintainability:** ownership of state, scope of providers, boundaries between features, rules living in one place,
   how hard it is to change or delete.
4. **Performance:** leaks (subscriptions, timers, listeners), requests per keystroke, change detection, bundle impact.
5. **Tests:** is the behaviour that matters tested, and would the tests fail for the bug? Missing tests for a blocking fix are themselves a finding.
6. **Style:** naming, formatting, comments. Prefer automation; keep nits few.

Severity labels, used in every Part 2 `SOLUTION.md`:

| Label | Meaning | Merge? |
|-------|---------|--------|
| **blocking** | Wrong behaviour, a security hole, data loss, or something that will be expensive to undo later. | No, until fixed. |
| **should-fix** | Real defect or maintainability cost with a clear fix, not an emergency. | In this PR or a linked ticket. |
| **nit** | Taste or small polish. | Yes; at most a few per review. |
| **question** | You cannot tell if it is a problem; ask for the reason. | Depends on the answer. |

Two habits that separate a staff review from a long one: **state the impact** ("a lost response creates duplicate orders") rather than the rule
("do not retry POST"), and **also say what is fine**, in one line, when something looks suspicious and is correct.

## Suggested study order for the staff challenge (7 days)

1. **Security** L1-L3, then re-read the rubric (the cheapest findings with the highest severity).
2. **HTTP and error architecture** L1-L3 (interceptor order, retries, 401 handling are interview classics).
3. **State at scale** L1-L3 and **DI architecture** L1-L3 (scope and ownership are the common root cause).
4. **Accessibility** L1-L3 (fast to spot once you know the patterns) and **SSR** L1-L3 (know what each failure looks like and what a unit test can prove).
5. **Feature architecture** L1-L3: practise saying what you would change and what you would *not* block on.
6. **Capstone**: set a 45-minute timer, write the review before reading `REVIEW.md`; then do a second pass on a real PR from your own work.
7. **Part 1 refresh**: RxJS L5-L8, Change detection L1-L3, Testing L1-L3, Routing L3-L5, Lifecycle and Memory, as time allows. Re-read the
   "Angular 19 to 22" table below out loud.

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
| `@Service` | `@Service()` is a new decorator for services: auto-provided in root by default; `@Service({ autoProvided: false })` must be listed in a `providers` array (use it for per-component state); `@Service({ factory })` builds the value. No constructor injection (use `inject()`), no other Angular decorator on the same class. `ng generate service` now emits `@Service()` (`--injectable` gives `@Injectable({ providedIn: 'root' })`). | DI L1-L2 |
| Hydration | `provideClientHydration()` enables the HTTP transfer cache and incremental hydration by default (`withIncrementalHydration()` is deprecated, `withNoIncrementalHydration()` opts out). Incremental hydration includes event replay. Requests with `Authorization`, cookies or credentials are not transferred by default. | SSR L2-L3 |
| Server mode | `afterNextRender` and the transfer cache decide "am I on the server?" from the `ngServerMode` global, not from `PLATFORM_ID`. | SSR L1-L2 |
| HTTP | `provideHttpClient` in a child injector is an independent client: add `withRequestsMadeViaParent()` to keep the parent's interceptors. Re-subscribing (`retry`) does not re-run downstream interceptor functions: wrap `next(req)` in `defer`. | DI L3, HTTP errors L2 |
| SignalStore | `patchState` compares each top-level slice by reference: mutating and returning the same object notifies nothing. `withEntities` gives normalized state; derive with `withComputed`. | State L2-L3 |
| `host` metadata | `host: { '(window:resize)': ... }` replaces `@HostListener`/`@HostBinding` and removes listeners for you (the Angular style guide prefers it). | Directives L1, Memory L1 |

## Project layout

```
src/app/core/                        shared domain, fake backend, API client; test helpers for Part 2
                                     (a11y-queries, server-env, architecture-rules)
src/app/exercises/exercise-registry.ts   the list of exercises (drives the index page and the lazy routes)
src/app/exercises/<topic>/<NN-slug>/     TICKET.md, HINTS.md, code, spec (+ SOLUTION.md on `solutions`)
odd/tasks/angular-review-dojo.md     the plan and the evidence behind this repo
```

Some routing exercises build their own router inside the exercise folder; open them from the index page, but the specs are
the faithful way to run them (a few redirects inside them use absolute URLs that only make sense when the routes are mounted at
the root, as the specs do).
