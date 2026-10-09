# L1 - Quantity steppers

**Reported by:** QA  |  **Area:** Cart quantity controls  |  **Priority:** High

## What we see

1. In the cart each product has its own quantity control. Pressing "+" on the first product also changes the quantity of
   the second one (and of every other stepper on the page); they always show the same number.
2. The "Reset" button does not reset anything: the quantity stays where it was, and the browser console shows
   `NG0203: inject() must be called from an injection context` every time it is pressed. The analytics team also reports
   that the "stepper-reset" event never arrives.

## Expected

Each stepper counts on its own. "Reset" sets the quantity back to 1 and records a `stepper-reset:<product>` event.
