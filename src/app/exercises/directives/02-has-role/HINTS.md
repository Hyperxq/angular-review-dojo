# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

A structural directive owns a `ViewContainerRef`. Who clears the views it created before it creates
new ones? And when is the check for the role executed: once, or every time something changes?

</details>

<details><summary>Hint 2 - area</summary>

- `*appHasRole="'admin'; else denied"` is sugar for `[appHasRole]="'admin'"` and
  `[appHasRoleElse]="denied"` on an `<ng-template>`. In which order are the two inputs set?
  What does the setter of the first one see?
- `this.auth.role()` is a signal. Reading it inside an input setter only reads it *at that
  moment*. What can re-run code when a signal changes?
- With signal inputs (`input()`), the directive has no setter at all.

</details>

<details><summary>Hint 3 - near the answer</summary>

Declare `readonly appHasRole = input.required<Role>()` and `readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null)`,
derive `computed(() => this.auth.role() === this.appHasRole())`, and render in an `effect`: clear the container,
then create the main template or the `else` template. Use `untracked` for the imperative part.
