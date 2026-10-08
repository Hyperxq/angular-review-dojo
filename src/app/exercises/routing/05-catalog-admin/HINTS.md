# L5 - Hints

<details><summary>Hint 1 - nudge</summary>

Four separate defects, in four different places: the route config, a guard, the layout template and
a title strategy. Start with the one you can reproduce fastest.

</details>

<details><summary>Hint 2 - area</summary>

- `providers` on a `Route` creates an environment injector for that route. How many injectors (and
  therefore store instances) do you get with two sibling routes that each list `DraftStore`? Where
  would a single shared one live?
- What does the confirmation guard look at before it bothers the user?
- A named outlet link only works if the **name in the link**, the **`outlet` in the route** and the
  **`name` on the `<router-outlet>`** are the same string.
- `TitleStrategy.buildTitle()` returns `string | undefined`. What if the route has no title?

</details>

<details><summary>Hint 3 - near the answer</summary>

Move `providers: [DraftStore]` to the parent route that owns the tabs (the one with
`component: ProductsLayout`). Make the guard return `true` immediately when
`inject(DraftStore).dirty()` is false. Rename the outlet in the layout to `aside`. In the title
strategy, fall back to a plain `'Admin'` when `buildTitle` returns `undefined`.

</details>
