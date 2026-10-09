# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Trace one `add()` call through both stores on a timeline: when does each store change, and what exactly does the error
callback undo? Then imagine a second `add()` and a logout between "request sent" and "response received".

</details>

<details><summary>Hint 2 - area</summary>

- The rollback restores a **snapshot** of the whole stock map taken before the call. What else was written to that map
  between taking the snapshot and the failure? What is the alternative to "put the old state back"?
- The cart is written optimistically too. Which line undoes it?
- The cart stores `items` at the top level of a **root** singleton. Whose items are they? What identifies the owner, and
  who owns the failed request's side effects when the error arrives?

</details>

<details><summary>Hint 3 - near the answer</summary>

Undo with the inverse operation (`stock + 1` for that product, `quantity - 1` in that cart) instead of restoring a
snapshot. Key the carts by user (`carts: Record<userId, Record<productId, qty>>`) and derive the visible `items` with a
`computed` over `Session.userId()`; capture the user id when the request starts and roll back **that** cart. This also
makes logout/login switch carts with no reset logic.

</details>

---

Tests won't catch the product questions: should a failed reservation also tell the user which item failed? Should a
retry be offered? And whether the cart should live in the browser tab, the server or both (multi-tab consistency). They are
discussed in `SOLUTION.md`.
