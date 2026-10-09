# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Write the timeline for three requests that get `401` within the same millisecond. How many times does each line of the
interceptor run? Which of those executions should be shared?

</details>

<details><summary>Hint 2 - area</summary>

- A shared in-flight operation is an observable that every waiter subscribes to: which RxJS operator turns a cold request into one
  that is executed once for many subscribers (`share`)? When does it reset?
- The replay uses the request object created **before** the refresh. Where does the new token come from, and which request
  object must be sent?
- The refresh call also goes through `authInterceptor`. What happens when the refresh endpoint answers `401`?
  How do you tell the interceptor to leave certain requests alone (`HttpContext` + `HttpContextToken`)?
- What should happen to something in flight when an event happens (logout)? `takeUntil(event$)` unsubscribes, which cancels
  the HTTP request. Should the caller see silence or an error?

</details>

<details><summary>Hint 3 - near the answer</summary>

In `AuthService` keep one shared `refresh$` (the POST piped through `map`, `tap(set token)`, `takeUntil(loggedOut)`,
`throwIfEmpty(() => new AuthError('ended'))`, `share()`); add a `loggedOut` `Subject`. In the interceptor skip the refresh URL, and
on `401` do `auth.refresh().pipe(switchMap((token) => next(withToken(req, token))))`, mapping a failed refresh to
`AuthError('expired')` after calling `auth.logout()` once. Wrap every call in `takeUntil` of a notifier that errors with
`AuthError('ended')` when the session ends.

</details>

---

Tests won't catch a refresh token that rotates on every use being sent from two tabs at once (a cross-tab lock such as
the Web Locks API is the fix), or whether the refresh token itself is stored safely.
