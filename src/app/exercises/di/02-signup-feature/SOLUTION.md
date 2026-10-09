# L2 - Signup feature: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `SIGNUP_CONFIG` is an `InjectionToken` without a default and `provideSignup()` does not provide it: any app that only calls `provideSignup()` crashes with `NullInjectorError`. | **blocking** |
| 2 | `USERNAME_VALIDATORS` is registered three times **without `multi: true`**: each provider replaces the previous one, so the token is the last single function, not an array (here it crashes; with a looser consumer it would silently apply one rule). | **blocking** |
| 3 | `{ provide: AUDIT_LOG, useClass: BufferLogger }` creates a **second** logger. The form writes to one, the panel reads the other. | **blocking** |
| 4 | `provideSignup()` takes no arguments: the config can only be overridden by knowing the token. A typed `provideSignup({ maxLength })` is the documented way. | should-fix |
| 5 | Returning a raw `Provider[]` makes the API easy to misuse; `makeEnvironmentProviders` hides the list from components' `providers` arrays and from `imports`. | nit |

## Why

- **Defaults belong to the token.** `new InjectionToken<T>(name, { factory })` is the fallback when nobody provides the token; the
  consumer stays decoupled from whoever configures the feature. Without a factory the token is required and the failure is
  runtime (`NullInjectorError`), not compile time.
- **`multi: true` means "collect"**; without it "last registration wins".
  The validators list is also order-sensitive: providers are collected in registration order.
- **`useClass` instantiates; `useExisting` aliases.** If two tokens must observe the same object, alias one to the other. This
  is the usual bug when a class is provided under both a concrete token and an abstraction: `{ provide: Abstract, useClass: Impl }` plus
  `Impl` provided elsewhere yields two instances.
- `@Service({ autoProvided: false })` on `BufferLogger` (verified in 22.2.2) documents that the class must be provided explicitly
  by a provider recipe, which is why the recipes above matter.

## The fix

```ts
export const SIGNUP_CONFIG = new InjectionToken<SignupConfig>('SIGNUP_CONFIG', { factory: () => ({ maxLength: 12 }) });
{ provide: USERNAME_VALIDATORS, useValue: required, multi: true }, ...
{ provide: AUDIT_LOG, useExisting: LOGGER }
```

## Tradeoffs and discussion

- **Token with default vs. required token:** a default makes the feature work out of the box and hides misconfiguration; a required
  token fails loudly. For configuration with sensible defaults, prefer the default; for "must be chosen" things (API base URL
  in a library) prefer required.
- **Multi providers as an extension point:** they let features contribute validators/interceptors without knowing each other,
  but the order and the lack of deduplication become API. Document both.

## What a reviewer should say in the PR comment

> **Blocking:** `SIGNUP_CONFIG` has no default and `provideSignup()` doesn't provide it, so the feature crashes unless the app
> knows a hidden token: give the token a `factory`. **Blocking:** the validator providers lack `multi: true`, so only the last one wins.
> **Blocking:** `AUDIT_LOG` uses `useClass`, creating a second logger; use `useExisting: LOGGER`. *Should-fix:* expose
> `provideSignup(config?)` instead of asking apps to override tokens.
