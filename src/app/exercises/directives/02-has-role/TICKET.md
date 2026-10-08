# L2 - Role-based sections

**Reported by:** QA  |  **Area:** Admin panel  |  **Priority:** High

## What we see

1. A visitor who is not an admin sees the "Admin tools" section missing but also **no** "Access denied"
   message, although the template has one.
2. After signing in as an admin from the panel, "Admin tools" does not appear. A page reload
   (where the user is already admin at startup) does show it.
3. Signing out from the panel does not hide "Admin tools": the section stays on screen and the
   next request fails with 403.
4. Toggling between admin and guest a few times leaves several copies of "Admin tools" on the page.
5. The "Restricted section" is meant to follow the "Require ..." selector, but after changing the
   required role the old content stays and, sometimes, a second copy is added.

## Expected

Each section is shown exactly once when the current user has the required role, or replaced by
its fallback when they do not, and it follows both role changes and changes of the required role.
