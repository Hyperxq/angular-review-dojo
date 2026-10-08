# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Change detection checks a parent's template **before** its children's lifecycle hooks run. A value that a
child changes later, in a place the parent has already read, is a problem. Who reads what, and when?

</details>

<details><summary>Hint 2 - area</summary>

- Find the three expressions that give a different result the second time they are evaluated in the same pass.
  (In dev mode Angular evaluates each binding twice per refresh.)
- `ngAfterViewInit` runs after the parent's header was already rendered. Is there an earlier moment to publish
  the title, or a way for the header to *react* to the new title?
- `setTimeout` + `markForCheck` made the error go away. What did it cost? What does the work of
  `markForCheck` become when the title is a signal?
- A getter in a template runs on every check. What should be computed once?

</details>

<details><summary>Hint 3 - near the answer</summary>

Make the title a `signal` in `PageTitle`, set it from the page (constructor or `ngOnInit`), and read `title()` in
the layout. Remove the `setTimeout`/`ChangeDetectorRef`. Generate the field id once, in a field initializer,
not in a getter. Then you can drop the explicit `ChangeDetectionStrategy.Default` markers too.

</details>

---

Tests won't catch one nuance: with `OnPush` (the default in Angular 22) the title bug does **not** throw in dev mode,
because `OnPush` views that are not dirty are not checked in the second pass. It just renders a stale header.
