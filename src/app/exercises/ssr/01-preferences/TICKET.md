# L1 - Preferences panel (server rendering)

**Reported by:** Platform team  |  **Area:** Server-side rendering rollout  |  **Priority:** High

## What we see

We turned on server-side rendering for the account area. Every request to the preferences page now answers with a
`500` and the server log shows `ReferenceError: window is not defined` (sometimes `localStorage is not defined`
or `document is not defined`). In the browser the page worked fine before the rollout and still works when
the app is served as a plain single-page application.

## Expected

The page renders on the server with sensible defaults (light theme, no stored preference, no viewport width yet).
Once it is running in the browser it restores the saved theme, shows the real viewport width and keeps following
resizes. Nothing changes for the browser-only behaviour.
