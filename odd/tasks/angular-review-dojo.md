# Feature: angular-review-dojo

## Objective
Practice repo to prepare for an Angular code-review challenge: find and fix functional bugs and bad practices, from basic to advanced, on Angular 22 (coming from v19).

## Problem / Why
The user last used Angular 19. The challenge requires reviewing broken code and fixing it. Modern Angular (zoneless default, Vitest, Signal Forms, `resource`/`httpResource`, `linkedSignal`, signal inputs) changed the review surface.

## Scope
Topics: RxJS (deep: L1–L8), RxJS to Signals, Routing (L1–L5), Performance (L1–L4), Forms, Directives, Testing (Vitest + TestBed), Change detection (playground + L1–L3), Memory and profiling (guide + L1–L3), Lifecycle (L1–L3).

## Constraints / Conventions
- Angular 22.2.2, standalone, zoneless default, Vitest via `@angular/build:unit-test` (`npm test`).
- Shared fake domain: product catalog + cart with an in-memory fake backend (no real network).
- Every exercise lives in `src/app/exercises/<topic>/<level>-<slug>/` with:
  - broken code (compiles, looks plausible, is wrong),
  - `TICKET.md` — symptom only, as QA/PM would report it, no hints,
  - `HINTS.md` — 3 progressive hints (nudge → area → near-answer),
  - `*.spec.ts` — tests that describe the CORRECT behavior (RED on `main`, GREEN on `solutions`).
- `main` = exercises. `solutions` branch = fixed code + `SOLUTION.md` per exercise (what was wrong, why, the fix, the modern-Angular takeaway).
- Every exercise is reachable from an index page via routing.
- Artifacts in English.

## TDD
- Mode: strict (source: global Claude config). Runner: `npm test` (Vitest via Angular unit-test builder).
- Exercise specs are the RED evidence on `main`; the solution commit on `solutions` is GREEN.

## Delivery
- Local repo, no remote: work-unit commits on `main` + `solutions`; no PRs. Strategy: single-branch pair, recorded here.

## Tasks
- [x] T0 — Domain base: models, fake backend, layout, exercise index + lazy routes per topic. Route: delegated (writer trigger: 2+ non-trivial files).
- [x] T1 — RxJS L1–L8 (basic → advanced). Route: delegated.
- [x] T1b — RxJS → Signals modernization track (4 exercises: S1 cart-service, S2 variant-picker, S3 product-page, S4 quick-search + README cheat sheet). Route: delegated.
- [x] T2 — Routing L1–L5. Route: delegated.
- [x] T3 — Performance L1–L4. Route: delegated.
- [x] T4 — Forms L1–L3 (reactive + Signal Forms). Route: delegated.
- [x] T5 — Directives L1–L3. Route: delegated.
- [x] T6 — Testing (Vitest/TestBed) L1–L3. Route: delegated.
- [x] T8 — Change Detection track (playground + L1–L3). Route: delegated.
- [x] T9 — Memory & Profiling track (guide + L1–L3). Route: delegated.
- [x] T10 — Lifecycle hooks track (L1–L3 + README). Route: delegated.
- [x] T7 — Root README: how to use the dojo, levels map, workflow.

## Acceptance criteria
- `npm test` on `main`: base app specs green, exercise specs red for the documented reasons.
- `npm test` on `solutions`: all green.
- Each exercise has TICKET.md + HINTS.md on main and SOLUTION.md on solutions.

## Progress / Evidence
- Scaffold: `chore: scaffold Angular 22 workspace` (ng new 22.2.2, Vitest default).
- T0 done: `a5f5917` (main). Base specs: 12 passing (fake backend, registry, index, app). RED observed first (missing modules), then GREEN.
- T1 done. RED on `main` / GREEN on `solutions`, per exercise (main commit / solutions fix commit):
  - L1 product-list `ff1fffd` / `20973da` (2 red, 1 green guard)
  - L2 product-detail `d42aa6e` / `466e422` (2 red)
  - L3 product-search `e855d18` / `9cdd338` (4 red)
  - L4 category-browser `7e57bc8` / `a4d4a9f` (2 red)
  - L5 catalog-stats `8064e85` / `39ee45d` (4 red)
  - L6 product-browser `3517f54` / `ae40f5b` (3 red; "stops listening when destroyed" is vacuous on main because the call throws before subscribing)
  - L7 order-panel `be3454f` / `1a91a55` (5 red, marble tests)
  - L8 cart-store `8e04b0c` / `5942228` (6 red)
- T1b done: topic scaffold + README `3c5f4f7`; S1 `80e5298` / `00bea2e` (3 red); S2 `b37047e` / `3107096` (1 red); S3 `788ddae` / `5611a77` (2 red); S4 `723c92f` / `5061297` (5 red).
- Final `npm test -- --watch=false`: main 67 tests, 39 failed / 28 passed (only the exercise specs fail); solutions 67 passed / 0 failed (16 files).
- Verified Angular 22 APIs: `rxResource({ params, stream })` (not `request`/`loader`), resources register pending tasks so `fixture.whenStable()` waits for in-flight requests, `linkedSignal` `source` must be a stable signal (wrap ids in `computed`), `httpResource(() => url | undefined, options)`, OnPush is the default change detection, `HttpClient` uses fetch by default, `retry({ count, delay })`.
- Specs that cannot catch their defect: none fully; untested smells only (S1 `combineLatest` glitch is covered in SOLUTION.md but not asserted).

### T2–T10 evidence (main commit -> solutions fix commit; red/total tests on `main` for the exercise spec)
- Routing: L1 `305ba54`/`0112205` (4/7), L2 `54fa2cf`/`ef48dd6` (3/5), L3 `cdddb1f`+`8925f39`/`c373a7f` (6/9), L4 `8c7e45a`/`0ecf65e` (4/8), L5 `eb6920c`+`0fe6f53`/`d670de8` (6/9).
- Performance: L1 `6c62216`/`0052b73` (3/5), L2 `9ab8bd9`/`a37520e` (2/4; one smell untestable), L3 `5ed345a`/`84b576d` (4/5), L4 `de1dcb0`/`f8ba921` (3/5; bundle effects untestable).
- Forms: L1 `23610b6`/`a34e1d9` (3/5), L2 `22b3433`/`b7c74be` (7/11), L3 Signal Forms `c4d67d3`/`b05f8c5` (7/8). `@angular/forms/signals` exists in 22.2.2 (`@publicApi 22.0`).
- Directives: L1 `ad9622c`/`ec491b6` (4/6), L2 `f1c4662`/`7a54c91` (5/6), L3 `9db5b76`+`9ce1b86`/`e76126d` (6/11).
- Testing (weak spec green on `main`, `*.audit.spec.ts` red): L1 `6653f3c`/`e69c3d5`+`8558b45` (3 audit red), L2 `03e622f`/`c0a2cea` (1 audit red), L3 `4cceb07`/`73d434d`+`7d123f8` (2 audit red).
- Change detection: playground `965d9d0` (7 green on both branches), L1 `1f8a05b`/`04a4b90` (3/6), L2 `c7e8559`+`2e8ffb5`/`b32d44d` (4/4), L3 `07594ef`/`ff66fba` (5/6).
- Memory: L1 `3a5c0d4`/`053893b` (2/5), L2 `45d7a1e`/`e0febdd` (5/8), L3 `0e1bf3d`+`b292ca8`/`b69da29` (4/6), guide `de753e4`.
- Lifecycle: L1 `9842abf`/`a86499a` (5/5), L2 `96a56ab`+`59b3961`/`b76f351` (4/4), L3 `d8a96d8`+`a26b49f`/`8e3226b` (8/9), README `715ea67`.
- README `ac22f73`.
- Final `npm test -- --watch=false`: main 254 tests, 152 failed / 102 passed (47 files; only exercise specs fail, the 4 base files pass; 1 expected unhandled rejection from the Lifecycle L3 `async ngOnInit`); solutions 263 passed / 0 failed (47 files). `solutions` has 9 more tests than `main` because the Testing exercises replace weak specs with stronger ones.
- Findings: `paramsInheritanceStrategy` defaults to `'always'` in 22 (the "child cannot see parent params" bug no longer exists); missing `pathMatch` on an empty-path redirect throws NG04014 (not silent); NG0100 only surfaces for `Eager` views (OnPush dirty-only check makes it a silent stale view); `resource.value()` throws in the error state; `vi.mock` of relative imports is unsupported in the Angular unit-test builder; `getDeferBlocks()` is async.

## Part 2 — Staff level

Objective: prepare for a STAFF-level review challenge. Part 1 covered framework mechanics; Part 2 covers security, SSR, a11y, state at scale, DI architecture, HTTP/error architecture, feature architecture and prioritising review comments (severity: blocking / should-fix / nit).

### Part 2 conventions
- Same exercise layout as Part 1. On `solutions`, `SOLUTION.md` also lists a severity per finding and the tradeoff discussion.
- Registry marks topics with a part (`TOPIC_PART`); the index groups topics under "Part 1" / "Part 2".
- Dependency decision: `@ngrx/signals` 22.0.1 (peer `@angular/core ^22.0.0`, `rxjs ^6.5.3 || ^7.4.0`) is supported, so the state track uses real SignalStore. `@angular/ssr` / `@angular/platform-server` are NOT added: SSR exercises use `PLATFORM_ID: 'server'` plus stubbed browser globals.
- Spec helpers: `src/app/core/a11y-queries.ts` (role/name queries, no Testing Library), `src/app/core/server-env.ts` (server simulation).
- Route for every task below: delegated (single writer).

### Part 2 tasks
- [x] T11 — Security (`security`) L1–L3.
- [x] T12 — SSR and hydration (`ssr`) L1–L3.
- [x] T13 — Accessibility (`a11y`) L1–L3.
- [x] T14 — State at scale (`state`, SignalStore) L1–L3.
- [x] T15 — DI architecture (`di`) L1–L3.
- [x] T16 — HTTP and error architecture (`http-errors`) L1–L3.
- [x] T17 — Feature architecture (`architecture`) L1–L3 (L2 import-boundary fitness spec).
- [x] T18 — Capstone: PR review simulation (`capstone`) with `PR.md`, code, blocking-only specs, `REVIEW.md` on `solutions`.
- [x] T19 — Docs: root README (Part 2 section, levels map, study order, staff review rubric).

### Part 2 evidence
(main commit -> solutions fix commit, red/total tests on `main` for the exercise spec)

- Setup: plan `1f3aad4`, `@ngrx/signals` `496aa54`, registry `part` grouping `25c0b2d`, role/name query + server-env helpers `8cd9eb3`, node fs types `6a490f1`, import scanner `a4d3d32`.
- T11 Security: L1 `11e9068`/`0eeb100` (6/11), L2 `8c3d6f4`/`d790853` (4/7), L3 `d9530ec`/`e158c97` (5/8).
- T12 SSR: L1 `340f17d`/`9519441` (2/5), L2 `3f146a7`+`9b3ad68`/`c3eb672` (4/6), L3 `a92461d`/`ae9ecfd` (3/5).
- T13 a11y: L1 `8e303a3`+`f46c3dc`/`6d4788e` (6/7), L2 `e5ab413`/`6d6839f` (13/16), L3 `804838f`+`1240f04`/`54285c0` (6/8).
- T14 State: L1 `6df56b4`/`7f7b4ed` (4/5), L2 `342090b`/`14e2e19` (6/8), L3 `ba5ec0e`/`a520c13` (5/7).
- T15 DI: L1 `9faafa5`/`c59693a` (2/4; one expected unhandled NG0203), L2 `5993ad2`/`ed5a398` (6/6, all fail until both `multi` and the token default are fixed), L3 `6c1365c`/`83ae0e6` (3/4).
- T16 HTTP and errors: L1 `1ab4def`/`d96ff43` (3/6), L2 `fe19485`/`a2712e5` (5/6), L3 `af7a46b`/`7dd91bd` (6/9).
- T17 Architecture: L1 `9b49fd3`/`96bb21f` (2/6), L2 `45f7273`/`cb1296b` (3/4 fitness rules), L3 `714f442`/`57503a3` (4/10; the 5 behaviour tests are guards that pass on both branches).
- T18 Capstone: `1b176b8`+`736250a`/`2dd3f96` (4/5; blocking issues only), `REVIEW.md` on `solutions`.
- T19 README: `99b8eda` (Part 2 map, staff review rubric, 7-day study order, 19 to 22 additions).
- Final `npm test -- --watch=false`: main 412 tests, 254 failed / 158 passed (70 files; only exercise specs fail; 3 expected unhandled errors: Lifecycle L3, DI L1 NG0203, DI L2); solutions 421 passed / 0 failed (70 files).
- API facts verified in 22.2.2 / `@ngrx/signals` 22.0.1: `afterNextRender` and the HTTP transfer cache key off the `ngServerMode` global, not `PLATFORM_ID`; TestBed `APP_ID` is `a`, so `TransferState` reads `<script id="a-state">`; `provideClientHydration()` enables transfer cache and incremental hydration by default (`withIncrementalHydration()` deprecated) and incremental hydration includes event replay; transfer cache skips requests with auth headers/cookies/credentials by default; `retry` re-subscribes without re-running downstream interceptor functions (use `defer(() => next(req))`); `provideHttpClient` in a route is an independent client (`withRequestsMadeViaParent()` links it); `HttpClient` is injectable without `provideHttpClient` (root-provided), so "no provider" cannot be tested, assert "no request made" instead; `patchState` compares slices by reference (no freezing in 22.0.1); `@Service` decorator (`autoProvided`, `factory`) and `ng g service` emitting `@Service()`; XSRF interceptor only acts on same-origin non-GET requests; `RouterTestingHarness.navigateByUrl('/')` returned `null` for a nested empty-path route pair in the capstone (used a host component instead).
- Untestable or only partly testable defects: SSR hydration success and NG05xx errors (no real server renderer), DOM edits in `ngOnInit` (SSR L2), `hydrate on interaction` replay (SSR L3, covered by a source scan only), screen-reader output and contrast (a11y), token storage in `localStorage` (Security L2), where business rules should live (State L2, Architecture L1), multi-tab refresh (HTTP L3), decomposition quality (Architecture L3, ADR only), everything non-blocking in the capstone.
