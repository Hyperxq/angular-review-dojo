# Capstone - Review PR #482: price alerts

This is not a bug hunt with a ticket: it is a pull request. You are the reviewer.

1. Read `PR.md` as the author wrote it.
2. Read the code in this folder (about 400 lines). Run the app (`npm start`, "Price alerts") if it helps.
3. Write your review: what blocks the merge, what you would ask to change, what is only a nit or a question, and what looks
   suspicious but is fine. Order your comments by importance and say why.
4. Compare with `REVIEW.md` on the `solutions` branch.

`price-alerts.spec.ts` contains tests for the **blocking** problems only. They are red on `main`. Everything else in a good review
cannot be found by a test.

What the QA team reported after the first demo (symptoms only):

- A second customer-visible alert appears after the API had a hiccup while creating one alert.
- A note with a link or an image in it behaves strangely for other users.
- The "n active" badge in the header always shows 0.
- When typing quickly in the search box, the list sometimes shows the results of an earlier letter.
