# L1 - Order summary: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | The pricing rules (threshold, discount rate, tax) are re-implemented in the template and drifted from `priceOrder` (`> 500` vs `>= 500`): customers are shown a different price than they are invoiced. | **blocking** |
| 2 | `OrderSummary` is a presentational component that injects `ProductApi` and fetches stock by itself: it cannot be rendered or tested from its inputs, and data loading is split between the page and the component. | **blocking** |
| 3 | Magic numbers (`500`, `0.1`, `1.21`, the low-stock `5`) in a template: no name, no test, no single source. | should-fix |
| 4 | The low-stock threshold is still a template rule in the fix (`< 5`): move it next to the pricing rules if it is business logic. | nit |

## Why

- **One place per rule.** Business rules live in plain, framework-free functions (`priceOrder`) that are unit-tested; components call
  them. A template expression that re-does arithmetic is a second implementation waiting to disagree.
- **Smart/dumb (container/presentational).** The container owns *where data comes from* (HTTP, store, route) and *what happens on events*;
  the presentational component owns *how it looks* and takes data through inputs and reports through outputs. The test of the split is
  mechanical: can you render the component with only inputs and no providers? Here the spec verifies that **no request is made**.
- **Dependency direction.** UI depends on domain functions, not the other way round.

## The fix

```ts
protected readonly totals = computed(() => priceOrder(this.lines()));   // template: totals().total
readonly stock = input<Record<number, number>>({});                      // data comes in
// page: protected readonly stock = rxResource({ stream: () => this.api.stock() }); and [stock]="..."
```

## Tradeoffs and discussion

- **How far to take it:** a leaf component used once does not need a container if it has one trivial dependency. Do the split when
  the component is reused, when it needs different data sources in different places, or when its logic needs tests without the framework.
- **View models:** a `computed` that returns `{ lines, totals, lowStock }` for the template keeps the template free of logic and
  gives the component one thing to test.
- **Signals and DI:** a store-backed component can read the store directly and still be "dumb" in the sense that matters (no I/O
  code). The rule of thumb is no HTTP and no navigation in presentational components.

## What a reviewer should say in the PR comment

> **Blocking:** the template re-implements the pricing rules and has already drifted (`>` vs `>=` at $500, so the customer sees $605
> and is invoiced $544.50): use `priceOrder` through a `computed`. **Blocking:** `OrderSummary` injects `ProductApi`; make it
> presentational (`lines` and `stock` inputs, `confirm` output) and let the page load data. *Nit:* name the thresholds.
