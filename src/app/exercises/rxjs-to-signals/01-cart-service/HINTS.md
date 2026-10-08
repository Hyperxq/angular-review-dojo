# S1 - Hints

<details><summary>Hint 1 - nudge</summary>

Three numbers on the screen are right and one list is wrong, yet they come from the same data.
What is different about how the list receives its data?

</details>

<details><summary>Hint 2 - area</summary>

`CartService.add()` hands the same array instance to `next()` that it just changed. Think about
what a component with `OnPush` change detection and a signal input does when the value it
receives is the same reference as before. Why do the count and the total not have the problem?

</details>

<details><summary>Hint 3 - near the answer</summary>

Never mutate state that has already been emitted. Better: replace the `BehaviorSubject` +
`combineLatest` plumbing with `signal()` (exposed through `asReadonly()`) updated immutably with
`update()`, and derive count, subtotal, discount and total with `computed()`.

</details>
