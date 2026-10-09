# L3 - Content studio (security review)

**Reported by:** Security team and QA  |  **Area:** Release notes editor, attachments, sharing  |  **Priority:** Critical

## What we see

1. A colleague pasted a snippet from a forum into the release notes editor. When the notes were previewed,
   an alert box appeared although nobody had written one on purpose. Another colleague found out that a link written
   as `[docs](javascript:alert(1))` and one whose address contained a quote also run code when previewed.
2. The attachments list: a file named `../admin/users.csv` opens a page from another part of the API, and files with
   spaces in their names return `404`.
3. A user whose display name contains HTML (`Dana <img ...>`) triggers a script in everyone's "shared with you" banner.

## Expected

Whatever people type is shown as text unless it is deliberately formatting. No scripts run, a file name can never
change which resource a link points to, and names with spaces work.
