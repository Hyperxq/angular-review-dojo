# L4 - Account area

**Reported by:** QA  |  **Area:** Customer account  |  **Priority:** High

## What we see

1. Opening an order directly (`/account/7/orders/3`) shows the order list but nothing else: no
   order details anywhere.
2. Clicking an order in the list ends on a blank page, and the address bar shows `/orders/3` with
   no customer in it.
3. The "Back to orders" button on an order page does nothing and the console shows a routing error.
4. Security found that after signing out in another tab, a customer who already has the account
   page open can keep clicking between "Orders" and "Profile" and still see everything. Only a full
   reload sends them to the sign-in page.

## Expected

The order details show next to the list, every link
and button stays inside the account area, and signing out protects every page in it.
