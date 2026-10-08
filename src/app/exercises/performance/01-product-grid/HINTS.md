# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Three problems, all in the template: two `@for` blocks and one expression. Ask for each: what
identity does Angular use to decide "this is the same row as before"?

</details>

<details><summary>Hint 2 - area</summary>

- `track` tells Angular which existing DOM node belongs to which item. What happens to a row
  tracked by its **position** when the order changes? What happens to a row tracked by the
  **object** when the list is refreshed with new copies of the same data?
- Template expressions are re-evaluated whenever the view is checked. Which of them is expensive,
  and where should an expensive derivation live instead?

</details>

<details><summary>Hint 3 - near the answer</summary>

Use a stable business key: `track product.id`. Move `pricing.discountedPrice(...)` out of the template:
compute the displayed rows once in a `computed()` (map the products to `{ product, price }`) and
sort that.

</details>
