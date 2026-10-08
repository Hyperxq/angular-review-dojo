# L2 - Role-based sections: solution

## What was wrong

1. **No `container.clear()`.** Every time the input setter ran it appended another embedded view to
   the container: the copies pile up, and a view created for an old input value is never removed.
2. **The role was read once, inside an input setter.** `this.auth.role()` was evaluated at the
   moment Angular set the input, and then never again. A setter is not a reactive context; the
   directive could not know the role had changed.
3. **The `else` input was not set yet when the `appHasRole` setter ran.** In
   `*appHasRole="'admin'; else denied"` the two inputs are separate bindings set one after the other, so
   the setter of the first cannot rely on the second (the fallback was never rendered). Setters that
   depend on sibling inputs are fragile.

## The fix

```ts
readonly appHasRole = input.required<Role>();
readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null);
private readonly allowed = computed(() => this.auth.role() === this.appHasRole());

constructor() {
  effect(() => {
    const allowed = this.allowed();
    const fallback = this.appHasRoleElse();
    untracked(() => {
      this.container.clear();
      const view = allowed ? this.template : fallback;
      if (view) this.container.createEmbeddedView(view);
    });
  });
}
```

- The microsyntax `*appHasRole="x; else y"` maps to inputs named `appHasRole` and `appHasRole` + `Else`
  (the directive selector as prefix plus the capitalised key). With signal inputs there is
  no ordering problem: both are signals, read together in the effect.
- The effect is a legitimate use here: it drives an imperative API (`ViewContainerRef`). The condition itself
  is a `computed`. `untracked` makes sure that nothing read while clearing and creating the views becomes a
  dependency of the effect, so it re-runs only when `allowed` or the fallback template change.

## Modern Angular takeaway

- Structural directives are a good fit for `input()` + `computed` + `effect`; no `ngOnChanges`, no
  setters, no `ChangeDetectorRef`.
- For simple show/hide of template content, check whether `@if (auth.isAdmin())` in the template
  (or a `computed`) already does the job: a custom directive is for reuse of the *rule*, and the built-in
  control flow is faster to read.

## What a reviewer should say in the PR comment

> The directive decides in an input setter, so it neither reacts to the role signal nor removes the view it
> created before (copies pile up), and the `else` template is still undefined when the first setter
> runs. Make both inputs signals, derive the condition with `computed`, and render in an `effect` that
> clears the container first.
