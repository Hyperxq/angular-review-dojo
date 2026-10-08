# L3 - Checkout form

**Reported by:** QA  |  **Area:** Checkout  |  **Priority:** Critical

## What we see

1. As soon as the checkout page opens, before touching anything, two red messages are already on
   screen ("Emails do not match" and "Write a gift note").
2. The "Gift note" box is always there and is mandatory, even for orders that are not a gift.
3. The email field is prefilled from the account. If the customer changes it to another address and
   types the same new address in "Confirm email", the form still says the emails do not match.
4. Pressing "Place order" with the form full of errors still places the order. Finance has received
   orders with mismatching emails and no quantity.

## Expected

Messages only appear for fields the customer has visited (or after pressing "Place order"), the
gift note is only asked for on gifts, the email confirmation compares against the current email, and
an invalid form never reaches the backend.
