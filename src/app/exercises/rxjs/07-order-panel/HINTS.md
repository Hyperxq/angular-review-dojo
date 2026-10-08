# L7 - Hints

<details><summary>Hint 1 - nudge</summary>

Draw the marble diagrams on paper. For each stream ask: "which source is allowed to cause an
emission, and which source is only a value I want to read?" And what does a well-behaved operator
promise to its consumer about `complete`, `error` and unsubscribe?

</details>

<details><summary>Hint 2 - area</summary>

- `order-streams.ts`: `combineLatest` emits when ANY input emits. Two inputs derived from the same
  source emit one after the other, and the click stream is not supposed to be "latest" anything.
- `with-previous.ts`: look at what `new Observable(subscriber => ...)` must do with the source
  subscription, and with the other two notification types.

</details>

<details><summary>Hint 3 - near the answer</summary>

Total: one `map` over the line, no `combineLatest` of two views of the same stream. Order:
`click$.pipe(withLatestFrom(line$), exhaustMap(...))`. Operator: forward `error` and `complete`
to the subscriber and return the source subscription as the teardown.

</details>
