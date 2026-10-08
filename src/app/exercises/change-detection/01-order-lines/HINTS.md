# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

The data is right (print it in the console), the screen is not. The components are OnPush: by what
rule does an OnPush component decide to check its template?

</details>

<details><summary>Hint 2 - area</summary>

- Look at how the parent changes `lines`: `push`, `splice`, and in the child a property assignment. What
  happens to the array **reference** each time?
- One spot works. Find out why, and what it costs: `ChangeDetectorRef.detectChanges()` renders
  only that component. Who else needs to know?
- Read the "What marks an OnPush view dirty" section of the playground's `EXPLAINER.md`.

</details>

<details><summary>Hint 3 - near the answer</summary>

Make `lines` a `signal` in the parent and update it immutably (`update(lines => [...lines, line])`,
`filter`, `map` with a spread for the changed line). Pass `lines()` to children that declare
`input.required<OrderLine[]>()`. Let the list **emit** quantity changes instead of mutating its input,
and delete `ChangeDetectorRef`.

</details>
