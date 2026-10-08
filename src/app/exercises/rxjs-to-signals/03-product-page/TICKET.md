# S3 - Product page

**Reported by:** Support  |  **Area:** Product page  |  **Priority:** High

## What we see

- When a product cannot be loaded, the page shows "Loading product…" and the error message at the
  same time, and the loading text never goes away.
- After such a failure, clicking a link to a different product (the URL changes, the page
  doesn't) leaves the error on screen and nothing new loads. The page only recovers after a full
  reload. Even when it works, the old error text can flash while the next product is loading.

## Expected

An error replaces the loading state, and moving to another product starts from a clean state and
loads it.
