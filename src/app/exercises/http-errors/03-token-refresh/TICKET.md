# L3 - Token refresh

**Reported by:** SRE, Support and Security  |  **Area:** Authentication, HTTP  |  **Priority:** Critical

## What we see

1. When the access token expires the dashboard (which loads three things in parallel) triggers **three** calls to
   `POST /auth/refresh` at the same moment. The auth server rate-limits refresh tokens: the second and third call
   invalidate the token of the first, and the customer is logged out.
2. After a successful refresh the original requests are repeated but still answer `401`: the retry goes out with the old
   token and the dashboard shows an error right after the refresh worked.
3. When the refresh token is expired, the app sends refresh request after refresh request (the log of the auth server shows
   hundreds per minute from one browser) instead of sending the customer to the login page.
4. A customer pressed "Sign out" while a refresh was in flight. A moment later they were signed in again: the late refresh
   response put a new token back. Requests that were already in flight when they signed out kept running and delivered data
   to the screen of the next user on the shared computer.

## Expected

At most one refresh at a time, shared by all waiting requests, whose answers are replayed with the new token. A failed
refresh ends the session once and every waiting caller gets an error. Signing out cancels everything in flight and cannot be
undone by a late answer.
