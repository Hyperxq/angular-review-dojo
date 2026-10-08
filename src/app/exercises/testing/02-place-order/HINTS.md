# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Read the two `describe` blocks and ask what each one would still pass if the real code were
replaced with something completely different.

</details>

<details><summary>Hint 2 - area</summary>

- The `OrderClient` test replaces `HttpClient` with a hand-made object. What is it actually
  testing? Which part of the real code (pipes, operators, interceptors) never runs?
- `provideHttpClientTesting` gives you a `HttpTestingController`. Which of its methods tells you that a
  request you did not expect was made, or that one is still waiting? Is it called in this spec?
- The component tests never cover a failing request. Why does that matter for this bug?
- `vi.useFakeTimers()` changes the global clock. Who puts it back? What would a test running after
  it see?
- The component queries `.btn-primary` and `.msg-ok`. What would break those tests that has nothing
  to do with behaviour? Which queries survive a CSS refactor?

</details>

<details><summary>Hint 3 - near the answer</summary>

Test `OrderClient` against `provideHttpClientTesting()`: flush an error and assert there is no second
request (`http.expectNone` / `http.verify()` in `afterEach`). Query by role and text
(`getByRole`-style: `button` named "Place order", `[role=alert]`, `[role=status]`). Restore timers in
`afterEach(() => vi.useRealTimers())`. Then remove the `retry(2)` on a non-idempotent `POST`.

</details>

---

Tests won't catch every item here: unrestored fake timers or CSS-class selectors do not make
this suite fail today. They are findings you only get by reading the tests.
