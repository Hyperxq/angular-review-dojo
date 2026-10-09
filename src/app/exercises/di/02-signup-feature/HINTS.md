# L2 - Hints

<details><summary>Hint 1 - nudge</summary>

Read `provideSignup()` as a list of statements to the injector: for each token, "when someone asks for X, give them Y".
What happens when the same token appears three times? When one token is requested but nobody ever mentioned it?

</details>

<details><summary>Hint 2 - area</summary>

- What is the difference between `{ provide: T, useValue: v }` repeated three times and the same with `multi: true`? What
  does `inject(T)` return in each case?
- An `InjectionToken` can carry a default: `new InjectionToken<T>('name', { factory: () => ... })`. When is the factory used?
- `useClass: X` **creates a new instance of X** for that token. If two tokens must resolve to the *same* object, which
  provider recipe aliases one token to another (`useExisting`)?

</details>

<details><summary>Hint 3 - near the answer</summary>

Add `multi: true` to the three `USERNAME_VALIDATORS` providers. Give `SIGNUP_CONFIG` a `factory` with the defaults. Replace
`{ provide: AUDIT_LOG, useClass: BufferLogger }` with `{ provide: AUDIT_LOG, useExisting: LOGGER }`.

</details>

---

Tests won't catch whether the defaults are the right ones, or whether the feature should export a typed
`provideSignup({ maxLength })` configuration function: API design findings listed in `SOLUTION.md`.
