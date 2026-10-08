# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Two requests are in flight and the slow one answers last. What does the page do with an answer
it no longer cares about?

</details>

<details><summary>Hint 2 - area</summary>

Look at the shape of the code inside the `effect`: subscriptions nested inside subscriptions, and
nothing that cancels the previous chain when `id` changes. Also ask yourself whether the category
and the related products really depend on each other.

</details>

<details><summary>Hint 3 - near the answer</summary>

Turn the chain into one stream with a higher-order operator (`switchMap`), run independent
requests in parallel (`forkJoin`), and let Angular own the subscription: `rxResource` with
`params: () => this.id()` and a `stream` callback re-runs and cancels automatically.

</details>
