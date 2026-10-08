# Feature: angular-review-dojo

## Objective
Practice repo to prepare for an Angular code-review challenge: find and fix functional bugs and bad practices, from basic to advanced, on Angular 22 (coming from v19).

## Problem / Why
The user last used Angular 19. The challenge requires reviewing broken code and fixing it. Modern Angular (zoneless default, Vitest, Signal Forms, `resource`/`httpResource`, `linkedSignal`, signal inputs) changed the review surface.

## Scope
Topics: RxJS (deep: L1–L8), Routing, Performance, Forms, Directives, Testing (Vitest + TestBed), each L1–L3.

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
- [ ] T2 — Routing L1–L3. Route: delegated.
- [ ] T3 — Performance L1–L3. Route: delegated.
- [ ] T4 — Forms L1–L3 (reactive + Signal Forms). Route: delegated.
- [ ] T5 — Directives L1–L3. Route: delegated.
- [ ] T6 — Testing (Vitest/TestBed) L1–L3. Route: delegated.
- [ ] T7 — Root README: how to use the dojo, levels map, workflow.

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

