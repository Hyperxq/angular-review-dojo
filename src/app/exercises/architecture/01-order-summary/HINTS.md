# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Pick the order summary and list what it needs to know to draw itself, and what it knows how to do besides drawing.
Which of those could a plain function or a parent provide?

</details>

<details><summary>Hint 2 - area</summary>

- The template contains numbers (`500`, `0.1`, `1.21`) that look suspiciously like business rules. Is there already
  a place in this folder where those rules live and are tested?
- What does `inject(ProductApi)` in a component that renders given lines say about its role? Whose job is loading?
- If the page fetches the stock and hands it down through an `input`, what does the summary need besides `lines`?

</details>

<details><summary>Hint 3 - near the answer</summary>

Replace the template arithmetic with a `computed(() => priceOrder(this.lines()))` and bind to its fields. Remove
`inject(ProductApi)` from `OrderSummary`: add a `stock` input (`input<Record<number, number>>({})`) and let
`OrderSummaryPage` load the stock (a second `rxResource`) and pass it with `[stock]="stock()"`.

</details>

---

Tests won't catch where the line is drawn between a "smart" and a "dumb" component in a larger design (feature
facades, view models, signal stores): see the tradeoffs in `SOLUTION.md`.
