# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

There are two separate problems. For each one, ask: "what happens to this subscription / this
value when the component is on the screen, and what happens when it is gone?"

</details>

<details><summary>Hint 2 - area</summary>

- The app is zoneless and components are `OnPush` by default. Who tells Angular that `products`
  changed after an async response?
- `StockFeed.changes$` lives in a root service and outlives the component. Look at who subscribes
  to it, and who ever unsubscribes.

</details>

<details><summary>Hint 3 - near the answer</summary>

Stop assigning plain fields from `subscribe` callbacks. Derive a signal from the stream
(`toSignal`) so the template reads reactive state, and compose "initial load + reload on every
stock change" into a single stream with a flattening operator. `toSignal` also takes care of the
teardown when the component is destroyed.

</details>
