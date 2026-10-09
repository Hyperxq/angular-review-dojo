# L1 - Catalog page (failures)

**Reported by:** Support and SRE  |  **Area:** Catalog page, error handling  |  **Priority:** High

## What we see

1. Last Tuesday the product API was down for 40 minutes. The catalog page showed "No products found." the whole time:
   customers thought we had stopped selling, support got no alerts, and nobody could retry without reloading the page.
2. SRE searched the error-tracking tool for the incident and found nothing from the web app. Errors thrown by the app (not
   only HTTP ones) end up in the browser console and nowhere else; the people investigating have to ask customers for
   screenshots of the console.

## Expected

When loading fails the user is told so and can try again; "No products found." appears only when the API really returned an
empty list. Unexpected errors are reported to the error-tracking service in addition to the console.
