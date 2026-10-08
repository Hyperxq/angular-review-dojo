# L4 - Product page loading

**Reported by:** Web performance team  |  **Area:** Product page and routes  |  **Priority:** Medium

## What we see

1. The product page's first load transfers noticeably more JavaScript than the page needs.
   The reviews section and the CSV export code are in the first bundle although most visitors never
   scroll to the reviews or export anything.
2. The reviews list is rendered at once with the rest of the page. On slow connections the
   page is blocked on it.
3. The admin tools page is only used by staff, yet its code is downloaded by every shopper.
4. After the page loads, the browser quietly downloads every other page of the app, including
   the sales reports that only finance opens, on mobile data. Checkout, the page most visitors go
   to next, is not treated any differently from the rest.

## Expected

The first bundle only contains what the first screen needs. Reviews arrive when the user is about to
see them (without the page jumping around), the CSV tooling is fetched when somebody exports,
staff-only code is not shipped to shoppers, and only the pages people really go to next are
preloaded.
