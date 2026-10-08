# L5 - Hints

<details><summary>Hint 1 - nudge</summary>

Three different symptoms, three different questions about observables: how many subscribers does a
cold observable have, what does a late subscriber receive, and who owns the subscription to a
shared source after the last consumer left?

</details>

<details><summary>Hint 2 - area</summary>

- `catalog-stats.ts`: count the `| async` pipes on `products$`. Each one subscribes.
- `selection-store.ts`: which Subject flavour remembers the last value?
- `price-watch.ts`: read the docs for the `shareReplay` config object. What does the default do
  when the subscriber count drops to zero?

</details>

<details><summary>Hint 3 - near the answer</summary>

Convert the list into a signal once (`toSignal`) and derive the totals with `computed`. Hold the
selection in a `BehaviorSubject` (or a signal). Use
`shareReplay({ bufferSize: 1, refCount: true })` so the polling timer stops when the last watcher
unsubscribes and restarts fresh for the next one.

</details>
