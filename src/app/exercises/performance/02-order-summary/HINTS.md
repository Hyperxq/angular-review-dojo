# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Two unrelated problems. For the first one: the list updates and the summary does not. What is
different about how the two get their data?

</details>

<details><summary>Hint 2 - area</summary>

- A signal notifies its consumers when it is **set to a different value** (compared by reference
  by default). Does `lines.push(...)` set the signal? What does the OnPush child see in its input?
- Count how many times `OrderMath.subtotal` runs for one render of the summary template, including
  the calls made by `tax` and `total`.
- Look at how `itemCount` gets its value. Is there a simpler way to say "this value is derived
  from that input"?

</details>

<details><summary>Hint 3 - near the answer</summary>

Replace the order with a new object: `order.update((o) => ({ lines: [...o.lines, line] }))`. In the
summary compute `subtotal`, `tax`, `total` and `itemCount` in `computed()` signals (compute the
subtotal once and derive the others from it) and read those in the template. No `effect` is needed
to derive state.

</details>

---

Tests won't catch this one: one of the smells in `OrderSummary` is invisible to the spec because the
observable result is the same (the spec still passes on `main`). A reviewer should flag it anyway.
