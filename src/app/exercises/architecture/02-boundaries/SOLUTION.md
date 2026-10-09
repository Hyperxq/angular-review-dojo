# L2 - Boundaries between features: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `billing` imports `catalog/internal/price-list` directly: it depends on an implementation detail, so a rename breaks it. | **blocking** |
| 2 | `catalog` imports `TAX_RATE` from `billing` while `billing` imports `catalog`: a dependency cycle (billing -> catalog -> billing). | **blocking** |
| 3 | `shared/utils.ts` imports `billing`: "shared" now depends on a feature, so every feature that touches shared drags billing (and catalog) with it. | **blocking** |
| 4 | The rules lived in people's heads. | should-fix (fixed by the spec) |
| 5 | `shared` is a dumping ground by construction; each new file there needs a reason. | question |

## Why

- **Public API per feature.** `features/x/index.ts` is the contract; everything else is internal. Importing past it couples you to files
  the owner expects to change freely. Barrel files have costs (accidental cycles, bundler tree-shaking), so keep them small and
  explicit (named exports).
- **Dependencies point one way.** `feature -> shared` is fine, `shared -> feature` is not, and a graph of features should be
  acyclic. The usual fix for a cycle is to move the thing both need *down* (here the tax rate, to `shared`) or to invert the dependency.
- **Fitness functions.** A cheap automated test that fails when a rule is broken beats a wiki page. The spec here reads the import
  graph from the files themselves and has a non-vacuity floor (it fails if it stops finding code). Tools such as `eslint-plugin-boundaries`, `nx
  enforce-module-boundaries`, `dependency-cruiser` or `madge --circular` do the same at scale; this version exists so you can see the idea in 60 lines.

## The fix

```ts
// shared/tax.ts         export const TAX_RATE = 0.21;
// catalog/index.ts      export { PriceList } from './internal/price-list';
// billing -> import { PriceList } from '../catalog';
// catalog -> import { TAX_RATE } from '../../shared/tax';
// shared/utils.ts       describeInvoice(total: number, ...)  // no feature import
```

## What the tests can and cannot prove

The spec parses `import ... from` and `export ... from` statements with a regular expression and resolves relative paths. It does not
see dynamic `import()` expressions, path aliases from `tsconfig`, or type-only dependencies hidden in `d.ts` files, and
it only understands this folder's layout. It is a teaching tool; adopt a real linter for the whole repo.

## Tradeoffs and discussion

- **Should billing depend on catalog at all?** A third feature, `pricing`, owning the price list and tax, would be a dependency
  of both and make them siblings. That is a better target if either grows.
- **Barrels vs. direct imports:** barrels give you a place to enforce the API; they can slow tooling and encourage cycles. Some teams
  allow deep imports inside a feature and only forbid them across features, as here.
- **Enforcing in CI:** run the rules in the unit test run (cheap) and in lint (editor feedback).

## What a reviewer should say in the PR comment

> **Blocking:** billing imports `catalog/internal/...`; export what is needed from `catalog/index.ts` and import that. **Blocking:**
> billing and catalog import each other (cycle): move `TAX_RATE` down to `shared`. **Blocking:** `shared/utils.ts` imports a feature; pass
> the value in instead. Please keep the fitness spec in the suite so these cannot come back.
