# L2 - Signup feature

**Reported by:** QA and the team embedding the feature  |  **Area:** Signup feature library  |  **Priority:** High

## What we see

1. A team added the signup page to their app by calling `provideSignup()` as the feature's documentation says. The page
   crashes on opening with `NullInjectorError: No provider for InjectionToken SIGNUP_CONFIG`. The documentation never
   mentioned a config provider and they do not want to configure anything.
2. Submitting an empty username only says "At most 12 characters" (not "Required"), and a two-letter name is accepted as
   valid. Of the three validation rules only the last one is applied.
3. After a successful signup the "Audit trail" panel stays empty although the form logged the event.

## Expected

`provideSignup()` works on its own with sensible defaults (an app can still override them). All three rules apply and
the messages show together. The audit panel shows what the form logged.
