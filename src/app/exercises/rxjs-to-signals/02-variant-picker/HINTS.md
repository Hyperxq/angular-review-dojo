# S2 - Hints

<details><summary>Hint 1 - nudge</summary>

The component is reused when the parent swaps the product. Which pieces of its state belong to the
old product and should not survive the swap?

</details>

<details><summary>Hint 2 - area</summary>

The selected variant id lives in its own `BehaviorSubject` that nothing resets, and variant ids
are the same for every product. Look at what `ngOnChanges` does (and does not do) when `product`
changes.

</details>

<details><summary>Hint 3 - near the answer</summary>

Make `product` a signal `input.required()`, derive the variants and the price with `computed()`,
and hold the selection in a `linkedSignal` whose source is the product id: it is writable, and it
resets by itself when the source changes (but not when the same product is refreshed).

</details>
