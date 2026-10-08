# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Do not start with the code. For every test in `stock-badge.spec.ts`, ask: "if I broke the code on
purpose, which assertion would fail?" Try it: change `'Low stock'` to `'banana'` in the component and
see which tests notice.

</details>

<details><summary>Hint 2 - area</summary>

- What does `toBeTruthy()` on a component instance prove? And `toBeDefined()` on `textContent`?
- In a zoneless TestBed, when does the template update after `setInput`? What does the third test
  assert on, a rendered DOM or an empty one?
- Look at the `subscribe(...)` callbacks in the store tests. Does anything ever make the stream
  emit? How would you know if the callback never ran? (`expect.hasAssertions()`, `expect.assertions(n)`.)

</details>

<details><summary>Hint 3 - near the answer</summary>

Await rendering (`await fixture.whenStable()`) before reading the DOM, assert exact text, push values
through `StockFeed.changes$.next(...)` and collect the emissions into an array, then assert on it (or
use `expect.assertions`). Then fix the two production bugs the stronger tests reveal: the
`0` case in the component and the boundary and restock handling in the store.

</details>
