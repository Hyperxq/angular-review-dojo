# L3 - Admin area

**Reported by:** QA and Platform team  |  **Area:** Admin area / sign-in  |  **Priority:** High

## What we see

1. A signed-out visitor who follows a link to `/admin/users` is sent to the sign-in page, as
   expected. After signing in as an admin they land on the page they were on before (or on Home),
   not on "Manage users". The `returnUrl` in the address bar already points to the wrong page.
2. The network tab shows the admin code being downloaded for signed-out visitors and for customers
   who open `/admin`, although they are turned away and never see an admin page.
3. Our navigation analytics records every trip to the sign-in or "no access" page as a blocked
   navigation, not as a redirect, so the "denied access" chart counts people who were simply asked
   to sign in.
4. The main bundle contains the "Sales reports" page, which only admins can open.

## Expected

Visitors who are not admins never download admin code. Not signed in means a redirect to the
sign-in page that remembers the page they asked for, and returns them there after signing in;
signed in as a customer means a redirect to the "no access" page. The reports page loads on
demand, like the rest of the admin area.
