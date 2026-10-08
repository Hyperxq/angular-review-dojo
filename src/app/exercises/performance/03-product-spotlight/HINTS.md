# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Two of these symptoms have the same root cause. Think about what makes Angular re-render a view in
an application that does not use zone.js, and who tells it that something changed here.

</details>

<details><summary>Hint 2 - area</summary>

- Which things in this class are plain fields, and where are they assigned from? (`setTimeout`,
  browser events.) The component is OnPush, and the app is zoneless.
- Angular has a dedicated directive for hero/LCP images. What does it require and what does it set
  on the `<img>`?
- An `effect` re-runs when **any** signal it reads changes. Which signals are read inside this one
  and which of them should count?

</details>

<details><summary>Hint 3 - near the answer</summary>

Make `promoVisible` and `online` signals (`signal(true)`, `.set(...)` in the callbacks), or use
`host` listeners such as `'(window:offline)': 'online.set(false)'`. Use `NgOptimizedImage`
(`ngSrc`, `width`, `height`, `priority`). In the effect, read `cart.count()` inside `untracked(...)`,
or better, pass only what you need.

</details>
