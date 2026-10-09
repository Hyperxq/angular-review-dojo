# L2 - Filter widgets (accessibility audit)

**Reported by:** Accessibility audit (keyboard and screen reader testing)  |  **Area:** Shop filters, account page, newsletter  |  **Priority:** High

## What we see

1. The "Sort by" control can only be used with a mouse. With the keyboard the arrow keys do nothing and Escape does not
   close it. A screen reader says "button, Relevance": it never says there is a list, whether it is open, or which option is
   selected.
2. The "Delete account" confirmation opens, but keyboard focus stays on the page behind it: pressing Tab walks through
   the page, Enter on the focused "Delete account" button opens it again, and a screen reader does not announce a dialog at
   all. Escape does nothing, and after closing it the focus is lost (it starts again from the top of the page).
3. Submitting the newsletter form with an invalid email shows a red message, but screen reader users hear nothing. The
   field is not marked as invalid and is not connected to the message.

## Expected

The dropdown follows the listbox pattern with full keyboard support, the dialog is modal for everyone (announced, focus
moves in, stays in, Escape closes, focus returns), and form errors are announced and linked to their field.
