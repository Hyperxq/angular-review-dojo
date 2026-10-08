# L2 - Page header

**Reported by:** Front-end team  |  **Area:** Shared page layout  |  **Priority:** Medium

## What we see

1. Opening the Products page in development, the console shows
   `ExpressionChangedAfterItHasBeenCheckedError` pointing at the page layout, and the unit test that renders the
   page crashes with it. In the production build there is no error, but the `<h1>` in the layout is empty
   until something else on the page triggers a refresh.
2. The Orders page does not crash, but its title appears a moment *after* the page content (the heading
   flashes empty). A teammate "fixed" the error there by wrapping the assignment in `setTimeout` and calling
   `markForCheck()`, and the end-to-end tests that read the heading right after navigation have been flaky ever since.
3. The feedback box fails the same error in dev, and in production the label does not focus the text area
   when clicked.

## Expected

No dev-mode errors, the heading is correct on the first render, and the feedback label is tied to its text area.
