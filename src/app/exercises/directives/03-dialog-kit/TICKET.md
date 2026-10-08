# L3 - Dialog kit

**Reported by:** Accessibility review + QA  |  **Area:** Settings dialog  |  **Priority:** High

## What we see

1. With the dialog open, pressing Tab on the last button sends the focus to the first button
   (good), but if I open "Show advanced", the new "Advanced option" button is not part of that
   loop: Tab on it leaves the dialog.
2. After closing the dialog with its "Close" button, the keyboard focus is lost (it ends up on the
   page body). Keyboard users have to tab through the whole page again to find the "Open settings"
   button.
3. Unticking "Close on outside click" does not stop clicks on the page from closing the dialog, and it
   also switches off the focus loop for keyboard users.
4. Ticking and unticking that box a couple of times makes the dialog react to a single click several
   times. After the dialog has been closed, each click anywhere on the page still logs an
   "Unexpected emit for destroyed OutputRef" warning in the console, and it keeps growing the more times the
   dialog was opened.

## Expected

The focus loop includes every control currently in the dialog, closing restores the focus to where it
was, each setting affects only what its label says, and a closed dialog leaves nothing listening to the page.
