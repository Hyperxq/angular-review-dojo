# L1 - Product reviews: solution

## What was wrong

| #   | Finding                                                                                                              | Severity                       |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | `SafeHtmlPipe` calls `bypassSecurityTrustHtml` on review comments, which are written by other customers: stored XSS. | **blocking**                   |
| 2   | `SafeUrlPipe` calls `bypassSecurityTrustUrl` on the author's website: `javascript:` links run on click.              | **blocking**                   |
| 3   | `returnUrl` goes straight into `location.assign`: open redirect (`https://evil`, `//evil`, `/\evil`, `javascript:`). | **blocking** (phishing vector) |
| 4   | `rel="noopener"` without `noreferrer`.                                                                               | nit                            |
| 5   | Rendering a link at all when the website is not `http(s)`; showing the raw string as link text.                      | should-fix                     |
| 6   | No Content-Security-Policy as defense in depth (not in this repo, but ask).                                          | question                       |

## Why

Angular is secure by default: values bound to `[innerHTML]`, `[href]`, `[src]`, `style` ... go through the
`DomSanitizer`. `bypassSecurityTrust*` means "I vouch that this value is safe". The only correct inputs are values
**you** produced (a static string, a constant); never data that crossed a trust boundary, and a pipe that makes the
bypass reusable makes the next misuse one import away.

An open redirect is not an Angular problem: any code that sends the browser to a string it did not build has to
decide what "same site" means. String checks (`startsWith('/')`) lose to `//host`, `/\host` and tab/newline
tricks the URL parser strips; resolving against a dummy origin with `URL` and comparing the origin asks the browser's
own parser.

## The fix

```html
<a [href]="review.website" target="_blank" rel="noopener noreferrer">{{ review.website }}</a>
<div class="comment" [innerHTML]="review.comment"></div>
```

```ts
export function safeReturnUrl(raw: string | undefined): string {
  if (!raw) return '/';
  const url = new URL(raw, 'http://app.invalid');
  return url.origin === 'http://app.invalid' ? url.pathname + url.search + url.hash : '/';
}
```

The built-in sanitizer keeps `<b>`, `<a href="https:...">` and friends, removes `onerror`, `<script>` and rewrites
`javascript:` to `unsafe:javascript:...` (with a dev-mode console warning).

## Tradeoffs and discussion

- **Sanitizing vs. escaping:** if comments are plain text, bind with `{{ }}` and be done; `[innerHTML]` is only needed if
  you want formatting. Rich text from users should be allowlisted server-side too (the client is not the only consumer).
- **Allowlist vs. `unsafe:`:** the sanitizer does not remove the link, it turns it into a dead `unsafe:` href. A reviewer
  can ask for "only render a link when the scheme is `http`/`https`" (should-fix, not blocking).
- **Why not `router.navigateByUrl(returnUrl)`?** The router only navigates inside the app, so it is not an open redirect
  by itself. This app deliberately does a full load, which is why the validation matters.

## Modern Angular takeaway

Grep for `bypassSecurityTrust`, `innerHTML` (the DOM property) and `location.` in every review: each hit needs a
justification tied to a trusted origin.

## What a reviewer should say in the PR comment

> **Blocking:** `SafeHtmlPipe`/`SafeUrlPipe` mark user-authored review text and URLs as trusted, which defeats Angular's
> sanitizer (stored XSS, `javascript:` links). Remove the pipes and bind directly: the default sanitizer already keeps
> basic formatting. **Blocking:** `returnUrl` is passed to `location.assign` unchecked: open redirect. Resolve it against
> a dummy origin with `URL` and fall back to `/` unless the origin matches. _Nit:_ add `noreferrer`. _Should-fix:_ do not
> show a link at all for non-`http(s)` websites.
