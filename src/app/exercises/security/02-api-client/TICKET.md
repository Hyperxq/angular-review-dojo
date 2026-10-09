# L2 - API client (security review)

**Reported by:** Security team and Backend team  |  **Area:** HTTP client  |  **Priority:** High

## What we see

1. The analytics vendor sent us a note: their collection endpoint receives an `Authorization: Bearer ...` header
   with what looks like a valid customer token on every page view.
2. The backend team switched on CSRF enforcement in staging (the API authenticates browser calls with a session
   cookie as well as the bearer token). Since then every `POST` and `PUT` from the web app is answered with
   `403 CSRF token missing`, although the cookie `XSRF-TOKEN` is set.
3. A support agent pasted the browser console of a customer into a ticket. It contained the customer's email
   address, a card number from a failed payment and their access token.

## Expected

The token is only ever sent to our own API. State-changing requests carry the CSRF header the backend expects.
Logs never contain personal data or credentials.
