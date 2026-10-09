# L1 - Product reviews (security report)

**Reported by:** Security team (penetration test) | **Area:** Product page | **Priority:** Critical

## What we see

1. A tester posted a review with a broken image in it. Every customer who opened the product page afterwards
   saw an alert box, and the tester could read the session cookie of those customers.
2. A reviewer entered `javascript:alert(document.cookie)` as their "website". Clicking the link next to their
   name runs the script.
3. The sign-in page sends customers back to the page they came from (`?returnUrl=...`). The tester sent a
   colleague a link to our sign-in page with another address in `returnUrl`; after signing in, the colleague was
   on a copy of our site that asked them to "confirm the card number".

## Expected

Review text may be formatted (bold, links) but can never run code, review links only ever open web pages,
and after signing in the customer only ever stays on our own site.
