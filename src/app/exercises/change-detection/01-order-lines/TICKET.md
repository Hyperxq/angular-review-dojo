# L1 - Order lines

**Reported by:** QA  |  **Area:** Order editor  |  **Priority:** High

## What we see

1. "Add next product" adds nothing visible to the list. The line shows up only if I press + or - on
   another line afterwards, and the summary underneath ("N lines, N items, total ...") stays out of date.
2. "Remove" on a line does not remove it from the screen. After clicking + or - on another line, the
   removed line disappears.
3. Pressing + or - on a line updates that line's quantity right away, but the summary at the bottom
   keeps showing the old item count and total.

## Expected

The list and the summary always match the order after every click.
