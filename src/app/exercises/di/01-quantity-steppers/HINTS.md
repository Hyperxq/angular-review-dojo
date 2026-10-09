# L1 - Hints

<details><summary>Hint 1 - nudge</summary>

How many `StepperState` objects exist when two steppers are on the page? Who decides that? And when exactly does
`inject()` get called in `reset()`?

</details>

<details><summary>Hint 2 - area</summary>

- The `@Service()` decorator provides the class automatically in the root injector, which means one instance for the whole
  app. What kind of data is a stepper's `count`: application-wide, or per component instance? What are the options in
  `@Service({...})` for a class that should **not** be provided automatically, and where do you provide it then?
- `inject()` only works in an injection context: constructors, field initializers, factory functions, and
  `runInInjectionContext`. A click handler runs long after construction. Where should the dependency be obtained?

</details>

<details><summary>Hint 3 - near the answer</summary>

Declare the state with `@Service({ autoProvided: false })` and list it in the stepper's `providers: [StepperState]` so each
component instance gets its own. Move `inject(Analytics)` to a field (`private readonly analytics = inject(Analytics)`) and
call `this.analytics.track(...)` in the handler.

</details>

---

Tests won't catch every item here: a root-provided service that holds per-instance state looks fine in a single-instance
demo. Finding it is a matter of asking "who owns this state?" for every service.
