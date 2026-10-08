# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Run the file as is, then run each test alone (`npm test -- --include=src/app/exercises/testing/03-cart-suite/cart.spec.ts --filter="adding the same"`).
What changes? Where does each test get its `CartStore` from?

</details>

<details><summary>Hint 2 - area</summary>

- A store created at the top of the file lives for the whole file. What does each test inherit from the
  previous one? Angular's TestBed starts every test with a fresh injector: how could you use it?
- `toBeGreaterThan(0)`, `toBeGreaterThanOrEqual(2)`, `toBeCloseTo(40.4, 0)`: for each, write down a
  wrong result that still passes.
- `await new Promise(r => setTimeout(r, 100))` in a test: what does it cost, and what happens on a
  machine that is slower than your laptop? What does Vitest give you to control time instead?
- `vi.spyOn(store as any, 'persist')` asserts how the code is written. What would happen to this test
  if `persist` were renamed? What observable effect should it check instead?
- Signal inputs are read-only properties. How do you give them a value in a test, the way a parent would?

</details>

<details><summary>Hint 3 - near the answer</summary>

Create the store with `TestBed.inject(CartStore)` in each test, clear `localStorage` in `beforeEach`, use
`vi.useFakeTimers()` + `vi.advanceTimersByTime(50)` and assert on `localStorage`, use exact matchers (`toEqual` of the
whole items array, `toBe(30.3)`), and set inputs with `fixture.componentRef.setInput('line', ...)`. Then fix
the two production bugs those tests expose: duplicate lines and floating-point totals (work in integer cents).

</details>

---

Tests won't catch everything here: some of the findings (a private-method spy, an `as any` input hack, a
sleeping test) are weaknesses of the suite that pass today.
