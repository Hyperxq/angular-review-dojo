# L3 - Cart suite: solution

## What was wrong

**The code:**

1. `add` always appended a new line, so adding the same product twice produced two lines. `count()` summed
   both and still returned 2, which is why the quantity assertion could not see it.
2. `total` summed floating-point products (`10.1 + 20.2 = 30.299999999999997`). Money should be rounded to the
   cent when it leaves the store (the fix rounds with `Math.round(x * 100) / 100`; storing integer cents is
   the sturdier long-term design).

**The suite:**

| Smell | Consequence |
|-------|-------------|
| `const store = new CartStore()` at module level | One store for the whole file. Each test starts with what the previous one left behind, so the tests pass in file order and fail alone (`--filter="adding the same"`) or shuffled. It also bypasses Angular's DI: a service with `inject()` would not even construct. |
| `toBeGreaterThan(0)`, `toBeGreaterThanOrEqual(2)`, `toBeCloseTo(40.4, 0)` | Each accepts wrong results: two lines pass "at least 2", a total off by 0.4 passes precision 0. Assert the exact value. |
| `await new Promise(r => setTimeout(r, 100))` | A real sleep: slow, and flaky when the machine is slower than the margin. With `vi.useFakeTimers()` the debounce is deterministic and the test can check the *boundary* (nothing at 49 ms, saved at 50 ms). |
| Unreset `localStorage` | State leaks between tests and files in the same environment. Clear it in `beforeEach`. |
| `vi.spyOn(store as any, 'persist')` | Asserts how the code is written: renaming a private method breaks the test, while a broken save would still pass it. Assert the observable effect (what ends up in storage). |
| `component.line = signal(...) as any` | Pokes at the framework internals: replaces a read-only input with a plain signal. It skips input binding entirely. `fixture.componentRef.setInput()` is the supported way, and it also lets you test input *changes*. |

## The fix

```ts
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); store = TestBed.inject(CartStore); });
afterEach(() => vi.useRealTimers());
...
fixture.componentRef.setInput('line', {...});
await fixture.whenStable();
```

Production: increment the quantity of an existing line; round the total to cents.

## Modern Angular / Vitest takeaway

- Get services from `TestBed.inject` so every test has a fresh injector; shared module-level state is the
  commonest source of order-dependent suites.
- `ng test` runs Vitest through `@angular/build:unit-test`: run one test with `--filter`, and treat
  "passes only in sequence" as a bug in the test.
- Assert behaviour (outputs, DOM, storage, HTTP traffic), not private methods or framework internals.

## What a reviewer should say in the PR comment

> The store is created once per file, so these tests depend on each other (try `--filter` on any of them).
> Use `TestBed.inject` in `beforeEach`, exact matchers instead of `>= 2`/`toBeCloseTo(x, 0)`, fake timers
> instead of a real 100 ms sleep, and `setInput` instead of overwriting the input signal. Don't spy on private
> `persist`; assert what ends up in `localStorage`. The production bugs these loose assertions hid: duplicate
> lines and float totals.
