# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Draw the injector tree: root environment injector, the route's environment injector (created for `providers` on a `Route`),
the shell component's node injector, the page component's node injector. For each service, which node of the tree answers
`inject()` for the shell? For the page?

</details>

<details><summary>Hint 2 - area</summary>

- `provideHttpClient(...)` inside a route's `providers` creates a **new, independent** `HttpClient` for that route and its
  children. What interceptors does it inherit from its parent? Which `HttpFeature` links it to the parent chain?
- `AuditLog` is auto-provided in root. What happens when the same class is also listed in a route's `providers`?
- `Selection` is also auto-provided in root, and the page lists it in its own `providers`. Which instance does the shell's
  badge get, and which one does the page get?

</details>

<details><summary>Hint 3 - near the answer</summary>

Keep only what the area really adds: `providers: [provideHttpClient(withRequestsMadeViaParent(), withInterceptors([reportsScopeInterceptor]))]`
on the route (the area's own interceptor, then the parent's chain). Delete `AuditLog` from the route's providers and
`Selection` from the page's `providers`: both are already provided where everybody can reach them.

</details>

---

Tests won't catch whether the shell and the page should share `Selection` through the root at all (a route-level
`providers: [Selection]` on the **parent** route would scope it to the area and destroy it when the user leaves): a design
choice for the PR discussion, covered in `SOLUTION.md`.
