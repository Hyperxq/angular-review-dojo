# L2 - Order form

**Reported by:** Warehouse team  |  **Area:** Back-office order entry  |  **Priority:** High

## What we see

1. Clicking the + and - buttons next to the quantity changes the number on screen, but the order
   is placed with quantity 1 anyway: we cannot order more than one of anything.
2. While typing a SKU, the network tab shows one availability request per keystroke. Support
   says it is hammering the inventory service.
3. If I press "Place order" right after typing a SKU, the order goes through before the
   availability check has finished, and sometimes with a SKU that turns out to be sold out.
4. Orders larger than the 10-unit limit per order are accepted if the units are split over several
   lines (for example 6 + 6).
5. When a line is disabled by the form (for example while an order is being sent) the +/- buttons
   keep working, and tabbing through the stepper never marks the field as visited.

## Expected

The stepper really edits the form, availability is checked once the user stops typing and the
order cannot be placed until the checks are done, the 10-unit limit applies to the whole order, and
the stepper behaves like any other form control.
