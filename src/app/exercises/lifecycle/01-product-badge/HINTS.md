# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Four symptoms, one cause: the component computes things at the wrong moment of its life. When are inputs
available, and how often does each hook run?

</details>

<details><summary>Hint 2 - area</summary>

- Are `@Input()` values set when the constructor runs?
- `ngOnInit` runs once. What happens to a value derived there when the input changes later?
- Read `ngOnChanges` carefully, character by character. And remember it fires when an input **binding** gets a new
  reference, not when someone mutates the object that was passed.

</details>

<details><summary>Hint 3 - near the answer</summary>

`product = input.required<Product>()`, then `tag = computed(...)`, `discountLabel = computed(...)` and
`expanded = linkedSignal({ source: this.product, computation: () => false })` (local state that resets when the product
changes). No constructor logic, no `OnInit`/`OnChanges`. In the parent, replace the product instead of mutating it.

</details>
