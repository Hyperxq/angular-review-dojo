# Model review of PR #482 "feat(alerts): price alerts for products"

The code on this branch fixes only the four **blocking** findings (so the specs are green). A reviewer does not fix everything
for the author: the other findings below stay in the code as the "requested changes".

## Verdict: Request changes

### Summary comment (what I would post at the top of the PR)

> Thanks for the PR, the feature reads well and the structure (store, API client, small components) is easy to follow. I like
> the immutable updates, `asReadonly()` on the alerts, the typed form and that the list is signal-based.
>
> I can't approve yet because of **four blocking issues**: (1) an XSS in the note rendering, (2) `POST` is retried, which will create
> duplicate alerts, (3) the search can show results for an older keystroke, (4) the store is provided twice, which is why the
> header badge stays at 0. Details and suggested fixes inline. I also left **should-fix** comments (polling cleanup, error handling,
> accessibility, a business rule in the template, `track $index`) which I'd like handled in this PR or tracked in a follow-up
> ticket that you link here, and a few nits and questions that are not blocking.
>
> The unit tests mentioned in the description are not in the PR: for the four blocking items I'd like a test each (I
> suggested the shape in the comments). Happy to pair on the DI one.

## Findings, ordered by severity

### Blocking

| # | File | Finding | Why it blocks | Suggested fix |
|---|------|---------|---------------|---------------|
| B1 | `alert-note.ts` | `bypassSecurityTrustHtml` on text typed by customers (the "emphasis" feature). | Stored XSS: any customer can run script in every other customer's session (security, correctness). | Escape `& < > "` first, add only the `<em>` you generate, bind the string to `[innerHTML]` so the sanitizer still runs. The author's premise ("the sanitizer stripped my `<em>`") is not right: the default sanitizer keeps `<em>`. |
| B2 | `alerts-api.ts` | `create()` is piped through `retry(3)`. | `POST` is not idempotent. If the server created the alert but the response was lost (the very failure that "1 in 10" staging drops produce), the retry creates up to 4 alerts and 4 notification subscriptions. | Remove the retry. Fix the flaky staging API or add an `Idempotency-Key` header and let the server de-duplicate; retry only idempotent reads. |
| B3 | `alerts-page.ts` | Search uses `mergeMap` over the query stream. | Responses can arrive out of order, so the list shows results for an older query (a real race, easy to reproduce on a slow network). | `switchMap` (cancels the previous request). Also `debounceTime` (see S6). |
| B4 | `alerts-page.ts` | `providers: [AlertsStore]` on the page while the store is already auto-provided in root. | Two stores: the page writes to its own, the header badge reads the root one, so it always says 0. State diverges silently. | Delete the component-level provider. If the intent is a store per visit (as the description says), provide it on the **parent** route/shell so both the badge and the page resolve the same instance. |

### Should-fix (in this PR or in a linked ticket)

| # | File | Finding | Suggested fix |
|---|------|---------|---------------|
| S1 | `alerts-page.ts` | `interval(30_000).subscribe(...)` in the constructor is never cleaned up: it keeps firing after navigating away and each visit adds another timer (leak, duplicated requests). | `.pipe(takeUntilDestroyed())`. Better: let the store own polling and stop it when hidden. |
| S2 | `alerts-store.ts` | `remove()` is optimistic but has no error path: if the delete fails the alert is gone from the UI and still exists on the server. | Restore the item on error (inverse operation) and surface a message. |
| S3 | `alerts-store.ts` | `load()` and `remove()` call `subscribe()` with no error callback: failures are unhandled and invisible. | Handle errors and expose them (a read-only `error` signal), or use a resource. |
| S4 | `alerts-page.ts`, `alert-form.ts` | Accessibility: the remove button is "✕" with no accessible name; error messages are plain `div`/`p` (not announced); the invalid price field has no `aria-invalid`. | `aria-label="Remove alert for {{ name }}"`, `role="alert"` on messages, `aria-invalid`/`aria-describedby`. |
| S5 | `alerts-page.ts` | `track $index` in the list. The author says alerts have no stable key, but `PriceAlert.id` exists in the model. Index tracking recycles DOM nodes wrongly when an item is removed from the middle. | `track alert.id`. |
| S6 | `alerts-page.ts` | A request per keystroke with no debounce, and two sources of truth (`results` vs `store.alerts`): an alert created while a search is active does not show. | `debounceTime(300)`; filter locally if the list is small, or put the query in the store. |
| S7 | `alerts-page.ts` | The business rule "target reached" (`priceOf(id) <= target`) lives in a template, with `Infinity` as the default and the seed catalog as the price source. | A pure function with a unit test; real prices from the API. |
| S8 | `alert-form.ts` | Only `required` on the price: `0` and negative prices are accepted; `Number(productId)` and `!` signal a loose model. | `Validators.min(0.01)`, a typed `productId` (`valueAsNumber` or `compareWith`). |
| S9 | `alerts.routes.ts` | The in-memory backend ships in the production route config. | Provide it only in dev (environment/provider flag) or delete before merge. |
| S10 | PR | Tests missing for the changes. | At least one test per blocking item. |

### Nits

- `AlertsStore.error` is a public writable signal: expose it read-only (`asReadonly()`), as was done for `alerts`.
- `alerts-demo-backend.ts` imports from `rxjs` twice and keeps module-level mutable state (fine for a mock, but then say so in a comment).
- `lastCheck` formatting `mediumTime` shows seconds; "Last checked 2 min ago" may be friendlier. Product decision.
- `ShellHost`-style naming and file organisation are fine; consider a `features/alerts/index.ts` public API if more features are coming.

### Questions

- Why is `alerts:count` written to `localStorage`? Who reads it? (If nothing, remove it; if a header badge on other pages, the store is the right source.)
- Are alerts per user? What happens to the root-scoped store on logout?
- Does the real API authorize by user, or does it rely on the client sending `productId` only? (Scope of PR, but worth confirming before launch.)

## Looks wrong, but is fine (do not comment, or comment to say "this is fine")

1. **`effect(() => localStorage.setItem(...))` in the store.** An effect that writes outside the signal graph is exactly what effects are for.
   (Only if SSR is enabled would I ask for a platform guard; it is not.)
2. **`subscribe()` without unsubscribing in `load()`/`add()`.** `HttpClient` calls emit once and complete, so there is nothing to leak. The real
   problem is the missing **error** handling (S3), and that is what to comment on. Contrast with S1, where the interval never completes.
3. **`provideHttpClient(withRequestsMadeViaParent(), withInterceptors([...]))` in the route's `providers`.** Looks like the classic "a lazy route re-provided
   `HttpClient`" bug, but `withRequestsMadeViaParent()` is the correct form: the route's interceptor runs, then the parent chain. (The issue is only that it
   hosts a mock: S9.)
4. *(minor)* `find(...)!` in the form: the options come from the same array, so it cannot be `undefined` there; only worth a comment if the data source changes.

Flagging these would cost credibility and review time. Saying "this is fine, I checked" in one line is a legitimate and useful comment.

## What to approve vs. what to request

- **Approve** the structure, the signal-based components, `NonNullableFormBuilder`, immutable updates and read-only exposure of state.
- **Request changes** for B1-B4 (a reviewer should not merge known XSS, duplicate writes, a race and a broken badge, however pleasant the rest is).
- **Allow follow-up tickets** for S1-S10 only if linked in the PR; S1 and S4 I would push for in this PR since they are cheap.
- **Do not block on** nits and questions.

## How to give this feedback constructively

- Lead with what works and say what you checked, then group the blockers so the author sees the size of the ask.
- One comment per finding, each with **the problem, the impact and a suggested change** (code if short). "This is wrong" is not feedback;
  "this retries a POST; if the response is lost the server creates a duplicate; remove the retry or add an idempotency key" is.
- Ask about intent when a decision may have a reason you cannot see (B4: "was the page-level provider intentional? the badge reads the root one").
- Label severity explicitly (`blocking:`, `should-fix:`, `nit:`, `question:`) so the author can plan, and keep nits few: a linter can say them.
- Challenge claims, not people: "the sanitizer keeps `<em>`, so we can drop the bypass" instead of "you misunderstood the sanitizer".
- Offer to pair when the fix is non-obvious (scoping the store), and re-review fast: blocked authors lose a day per round trip.

## Review order used (the rubric)

1. **Correctness** (does it do what it says; B2, B3, B4, S2)
2. **Security** (B1, B2 amplification, S9)
3. **Architecture and maintainability** (B4, S7, S6, nits on organisation)
4. **Performance** (S1, S6, S5)
5. **Tests** (S10)
6. **Style** (nits, left to the linter)
