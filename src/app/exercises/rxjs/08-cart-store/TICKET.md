# L8 - Cart store

**Reported by:** QA, Support and Platform  |  **Area:** Cart  |  **Priority:** Critical

## What we see

- QA: adding the same product several times sometimes does not update the cart totals or the
  "left in stock" figure until another action happens. Opening the app state in devtools shows
  values that have changed "in place" without the app reacting.
- QA: add a product while the stock refresh is happening and the "left" counter jumps back up for a
  few seconds, letting the customer add more units than we have.
- Support: when the stock reservation call fails (we saw a 500 during a deploy) the item stays in
  the customer's cart as if everything was fine and the counter is wrong.
- Platform: after the first time the stock endpoint returned an error, our dashboard shows that
  clients never call it again until they reload.
- Platform: stock requests keep arriving from browsers whose tab is in the background all day, and
  they keep arriving from users who already left the cart page.

## Expected

The cart and stock figures always match what the user did and what the server says, a failed
reservation is undone, and the app only talks to the stock API while the cart is on screen and the
tab is visible.
