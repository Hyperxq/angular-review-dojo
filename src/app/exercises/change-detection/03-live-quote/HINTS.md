# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Zone.js used to say "something happened" after every timer, event and callback. Nobody does that now.
For each value the template shows, ask: what tells Angular that it changed?

</details>

<details><summary>Hint 2 - area</summary>

- In a zoneless application what do `NgZone.run` and `runOutsideAngular` do for rendering? (Read the type docs of
  `NgZone` and `NoopNgZone`.)
- The template reads plain fields. What kind of value does a template subscribe to by itself?
- `ngDoCheck` is called when the *parent* is checked. Is anything checking the parent when a socket message arrives?
  Is `ngDoCheck` the right place to derive a value from other values?
- `ChangeDetectionStrategy.Default` on a child "makes it work". Why did it work, and what would it hide if the
  array were mutated?
- Who closes the socket?

</details>

<details><summary>Hint 3 - near the answer</summary>

Keep the state in signals: `quote = signal<Quote | null>(null)`, `history = signal<number[]>([])` (update with a
new array), `status = signal('connecting')`. `spread` is a `computed`. Register the socket callback with plain code
(no zone calls), clean it up with `inject(DestroyRef).onDestroy(() => socket.close())`, and clear the timer there as well.
Pass the history down with `input()` and remove the explicit `Default` strategies.

</details>

---

Tests won't catch every leftover: unused `NgZone` calls, the `Default` strategy on the child and the work in `ngDoCheck`
do not fail the spec on their own once the state is in signals. They are review findings.
