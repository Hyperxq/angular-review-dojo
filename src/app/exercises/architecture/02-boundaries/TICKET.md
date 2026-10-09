# L2 - Boundaries between features

**Reported by:** Tech lead and Build team  |  **Area:** Code organisation  |  **Priority:** Medium

## What we see

1. The build prints a circular dependency warning between billing and catalog, and the unit tests of one of them
   randomly fail with "cannot access X before initialization" depending on which file is loaded first.
2. The catalog team renamed a file in their `internal` folder; the billing feature stopped compiling. Billing "only" imports
   one class from there.
3. The shipping team wants to move their feature into its own library. They found that the shared folder, which every
   feature imports, imports billing, so extracting anything drags billing (and through it, catalog) along.
4. Every fix so far was agreed in a meeting and forgotten a month later.

## Expected

Features talk to each other only through their public entry point, nothing in `shared` depends on a feature,
and the feature dependency graph has no cycles. The rule is checked by the test suite so it cannot silently regress.
