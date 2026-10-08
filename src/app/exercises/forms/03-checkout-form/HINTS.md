# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

This form uses Signal Forms (`@angular/forms/signals`). A form schema function and the validators
inside it do not run the same number of times. Which parts run once, and which re-run when signals change?

</details>

<details><summary>Hint 2 - area</summary>

- The schema callback `(path) => { ... }` runs **once**, when the form is created. A value read
  there is a snapshot. Validator callbacks (`({ value, valueOf }) => ...`) are reactive. How does a
  validator read the *current* value of another field?
- Each field's state has more than `errors()`: look at `touched()`, `dirty()`, `invalid()`.
- `required(path, { when })` is conditional. Fields can also be `hidden`, or simply not rendered.
- Who validates the form when the `submit` event is handled by your own method? Check what
  `submit()` and the `formRoot` directive from `@angular/forms/signals` do.

</details>

<details><summary>Hint 3 - near the answer</summary>

Use `valueOf(path.email)` inside the validator for the comparison. Gate the messages with
`@if (field().touched())`. Use `required(path.giftNote, { when: ({ valueOf }) => valueOf(path.wantsGift) })`
and render the note under `@if (checkout.wantsGift().value())`. Submit through `submit(form, action)`
(or `<form [formRoot]="checkout">` with `submission.action` in the form options) so the action only runs
when the form is valid and every field is marked as touched.
