# L3 - Product search

**Reported by:** Support  |  **Area:** Catalog search  |  **Priority:** High

## What we see

- While I type a search term the Network tab fills with one request per keystroke, and the backend
  team says search traffic tripled since this page shipped.
- Typing "key" and then stopping sometimes shows results that do not match "key" (they match "ke").
  Retyping the same word fixes it.
- Pressing the same key twice, or re-entering the same term, fires the same search again.
- Double-clicking "Apply 10% off" on a result sends two price updates. On a slow network a
  colleague also saw a price update being cancelled halfway.

## Expected

One search per pause in typing, results always matching what is in the box, and one price update per
intended click.
