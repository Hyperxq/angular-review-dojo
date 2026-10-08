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
