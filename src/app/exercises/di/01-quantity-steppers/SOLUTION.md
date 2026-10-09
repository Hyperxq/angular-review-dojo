# L1 - Quantity steppers: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `StepperState` holds per-component state but is `@Service()`, which is auto-provided in the root injector: one instance shared by every stepper. | **blocking** |
| 2 | `inject(Analytics)` is called inside a click handler: no injection context, so it throws `NG0203` and the rest of the handler (the reset) never runs. | **blocking** |
| 3 | Analytics is fired before the state change: when tracking throws, the user action is lost. Tracking should never break the feature. | should-fix |

## Why

- **Scope is part of a service's design.** Root scope (`@Service()` by default, `@Injectable({ providedIn: 'root' })` in older code)
  means "one instance for the app" and is right for caches, API clients, configuration. State that belongs to a UI
  instance needs a shorter lifetime: put it in the component's `providers` (one instance per component, destroyed with it).
- **`@Service` in Angular 22** (verified in `@angular/core` types and compiler): `@Service()` is provided automatically in root;
  `@Service({ autoProvided: false })` is not provided anywhere until you list it in a `providers` array (the right choice for
  scoped state: forgetting to provide it is a `NullInjectorError`, not a silent singleton); `@Service({ factory: () => ... })`
  builds the value with a factory. The compiler rejects constructor parameter injection on a `@Service` class (use `inject()`)
  and combining `@Service` with another Angular decorator. `@Injectable({ providedIn: 'root' })` still works; `ng generate
  service` now creates `@Service()` (use `--injectable` for the old form).
- **`inject()` needs an injection context** (constructor, field initializer, provider factory, `runInInjectionContext`).
  Resolve dependencies once, in a field, and use the field in callbacks. If you must create something later, inject
  `Injector` and use `runInInjectionContext(injector, ...)`.

## The fix

```ts
@Service({ autoProvided: false })
export class StepperState { ... }

@Component({ selector: 'app-quantity-stepper', providers: [StepperState], ... })
export class QuantityStepper {
  private readonly analytics = inject(Analytics);
  protected readonly state = inject(StepperState);
  protected reset() { this.state.reset(); this.analytics.track(`stepper-reset:${this.label()}`); }
}
```

## Tradeoffs and discussion

- **Component `providers` vs. `viewProviders`:** `providers` are visible to projected content as well; `viewProviders` only to the
  component's own view. Prefer the narrower one when children should not see the service.
- **Signal inputs instead of a service:** for a stepper a plain `model()`/`signal` in the component would do; a service pays off when
  several child components need the same state.
- **Where `autoProvided: false` helps in review:** it makes the lifetime explicit in the class itself.

## What a reviewer should say in the PR comment

> **Blocking:** `StepperState` is auto-provided in root, so every stepper shares one count; the state is per instance, so use
> `@Service({ autoProvided: false })` and `providers: [StepperState]` on the component. **Blocking:** `inject(Analytics)` in the click
> handler throws NG0203 (no injection context); inject it in a field. *Should-fix:* track after the state change, tracking must not break
> the feature.
