# Capstone - Hints

<details><summary>Hint 1 - nudge</summary>

Review in layers, from the cheapest to the most expensive to fix later: correctness and security first, then architecture and
maintainability, then performance, tests, and finally style. For each comment decide: blocking, should-fix, nit, or question.

</details>

<details><summary>Hint 2 - area</summary>

- Read `PR.md` for claims that need checking ("I used bypassSecurityTrustHtml because...", "retries up to 3 times because...").
  An author's reason is a clue, not a justification.
- Follow one customer action through every file: create an alert (form -> store -> API -> list -> badge). Then follow data
  that comes from someone else (the note).
- Which things look wrong but are actually the correct form? (A reviewer who flags them loses credibility.)

</details>

<details><summary>Hint 3 - near the answer</summary>

Blocking: the note rendering, the retry on `POST`, the search that can show stale results, and the duplicated store. Should-fix: the
polling subscription, optimistic delete without rollback, accessibility of the buttons and errors, template business
rule, `track $index`, silent HTTP errors. Fine: the route-level HTTP provider with `withRequestsMadeViaParent()`, the `effect`
writing to `localStorage`, `subscribe()` without unsubscribe on finite HTTP calls.

</details>

---

Tests only cover the four blocking issues. The rest is judgement.
