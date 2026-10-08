# L1 - Stock badge: solution

## What was wrong

**The code (what shipped):**

1. `StockBadge` had no branch for `0`: sold-out products were "Low stock".
2. `LowStockStore` filtered with `< 5` (the rule is "5 or fewer") and, because it filtered *before*
   `scan`, a restock event never reached the accumulator, so products were never removed from the list.

**The tests (why CI stayed green):**

| Test | Why it could not fail |
|------|-----------------------|
| `should create` | `toBeTruthy()` on a component instance: it is always truthy. Checks only that the constructor does not throw. |
| `shows a label for low stock` | `toBeDefined()` on `textContent`: always a string. Any label (or none) passes. |
| `does not show the in-stock label when sold out` | `setInput` without `await fixture.whenStable()`/`detectChanges()`: the DOM is still empty, so "does not contain In stock" is trivially true. A negative assertion on an unrendered DOM proves nothing. |
| `collects the products that run low` | The assertion lives inside `subscribe`, but nothing ever calls `feed.changes$.next(...)`, so the callback never runs and the test has zero assertions. |
| `ignores products that are well stocked` | Same stream, and the `next` call happens *after* the subscription with a value that the filter drops: the callback still never runs. |

A test that cannot fail is worse than no test: it buys false confidence.

## The fix

Production code: `stock === 0` -> "Out of stock"; `scan` over every event with `<=` and removal on restock.

Tests: await rendering, assert exact text (`it.each` over the boundaries 0, 1, 5, 6), and for streams push
values through the real `StockFeed`, **collect emissions into an array and assert on the array** (a
synchronous, observable result) instead of asserting inside `subscribe`.

## How to review a test (checklist)

- Break the code on purpose. Does a test turn red? (Mutation testing automates this.)
- Does every test have at least one assertion that depends on the code under test? `expect.hasAssertions()` or
  `expect.assertions(n)` turns "callback never ran" into a failure.
- Are you asserting after the thing you assert on has actually happened (`await fixture.whenStable()`)?
- Never assert inside a subscription callback of a stream you do not control the timing of.
- Vitest helps: un-awaited `expect(...).resolves/rejects` is reported as an error, and assertions that
  fire after the test ended surface as "Unhandled errors". They do not catch assertions that never run.

## What a reviewer should say in the PR comment

> These specs cannot fail: `toBeTruthy` on the instance, `toBeDefined` on a string, a negative assertion on a DOM that was never
> rendered, and two assertions inside a `subscribe` callback that no test ever triggers. Await rendering, assert exact
> labels at the boundaries (0, 1, 5, 6), and push events through the feed and assert on the collected emissions.
