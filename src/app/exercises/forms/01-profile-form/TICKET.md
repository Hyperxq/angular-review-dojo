# L1 - Profile form

**Reported by:** Support  |  **Area:** Account / profile  |  **Priority:** High

## What we see

1. After saving the profile, the backend complains that the `email` is missing from the request, even
   though the form shows the email (greyed out, read-only) on screen.
2. Users can save a display name with a single character, or "ab". The hint under the field says
   it must have at least 3 characters, but the form accepts it.
3. If somebody presses "Save" on a completely empty form, nothing happens: no message, no red
   field. They think the button is broken.

## Expected

Saving sends all the profile fields, including the read-only email. The display name needs at least 3
characters, and pressing "Save" on an invalid form shows what is wrong.
