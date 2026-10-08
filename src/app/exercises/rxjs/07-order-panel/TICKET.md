# L7 - Order panel

**Reported by:** QA + Finance  |  **Area:** Checkout  |  **Priority:** Critical

## What we see

- After pressing "Place order" once, editing the quantity afterwards places another order every
  time. Finance found duplicate orders for the same customer, one per edit.
- The "Total" briefly flashes a wrong amount when the quantity changes (a mix of the new price
  and the old quantity), and the analytics team sees two total updates for a single change.
- The "Change since last edit" figure keeps being updated, and its updates are still processed
  after the panel is closed. When the underlying stream finishes, the panel never notices.
  If the stream fails, the error is lost entirely.

## Expected

An order is placed only when the button is pressed, the total updates once per change, and the
change indicator behaves like any other part of the stream (it stops, completes and fails with it).
