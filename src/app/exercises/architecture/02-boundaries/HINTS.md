# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Open `boundaries.spec.ts`: it is the written version of the rules, run as a test (an architectural *fitness function*).
Run it and read which file is accused of which rule. The code is the thing to fix, not the rule.

</details>

<details><summary>Hint 2 - area</summary>

- Which folder is the public API of a feature? What does the catalog's `index.ts` export, and what does billing really need from
  the catalog?
- Why does catalog import billing? What does it use from there, and does it belong to billing at all? (A constant used by two
  features belongs below both of them.)
- What is `shared` allowed to know about? What would a function in `shared` need as parameters instead of importing a feature's class?

</details>

<details><summary>Hint 3 - near the answer</summary>

Move `TAX_RATE` to `shared/tax.ts` and import it from there in both features. Export `PriceList` from
`features/catalog/index.ts` and import it in billing from `'../catalog'`. Rewrite `shared/utils.ts` so it takes the total
as a number (`describeInvoice(total, productId, quantity)`) and update the caller.

</details>

---

Tests won't catch design judgement: whether `shared` should exist at all (a "shared" folder is where cycles grow), or
whether billing should depend on catalog or both on a lower-level "pricing" feature. See `SOLUTION.md`.
