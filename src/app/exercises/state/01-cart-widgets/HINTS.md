# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

Ask of every piece of state: "is this a **source of truth**, or can it be derived from something else?" and "who is
allowed to change it?"

</details>

<details><summary>Hint 2 - area</summary>

- `total` and `count` are always a function of `items`. What happens to a value that you keep in sync by hand every time one
  of N methods runs (and forgot once)? Which signal API computes a value from others?
- `CartBadge` reads the cart **once**, in a field initializer. What kind of value does that produce, a live view or a copy?
- Public `signal(...)` properties on a root service can be `.set()` from anywhere. What does `asReadonly()` return?

</details>

<details><summary>Hint 3 - near the answer</summary>

Keep one private writable `items` signal, expose `items.asReadonly()`, and define `total` and `count` with `computed`.
Make `CartBadge` read `cart.count()` directly (or expose a `computed`) instead of copying a number.

</details>

---

Tests won't catch every item here: whether the service should expose methods (`add`, `remove`) or events, and whether
the public surface should be a read-only view or a facade, are design findings.
