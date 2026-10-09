# L3 - Content studio: solution

## What was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | `MarkdownPreview` assigns `nativeElement.innerHTML` directly: the DOM property skips Angular's sanitizer entirely. | **blocking** |
| 2 | `renderMarkdown` never escapes the source: raw HTML passes through, and the link rule puts an unescaped, unvalidated URL into an attribute (`javascript:` and quote break-out). | **blocking** |
| 3 | `ShareBanner` builds HTML by string concatenation and marks it trusted with `bypassSecurityTrustHtml`: stored XSS through a display name. | **blocking** |
| 4 | `AttachmentList` marks `/api/files/${file}/download` as a trusted URL with no encoding: path traversal inside the API and broken names. | **blocking** |
| 5 | The renderer is hand-written. A maintained library (with a sanitizer such as DOMPurify) is the better long-term answer. | should-fix |
| 6 | `trackBy` on `file`: duplicates would break `@for` (names should be unique ids). | nit |
| 7 | No Content-Security-Policy to limit the blast radius of any remaining hole. | question |

## Why

- **Three layers, in order:** (1) do not generate markup from text without escaping, (2) bind with `[innerHTML]` so the
  sanitizer runs, (3) CSP. The original code removed each layer: `innerHTML =` skips layer 2, the renderer skipped layer 1,
  the bypass methods skip layer 2 again.
- `DomSanitizer.bypassSecurityTrust*` does not sanitize; it **declares** a value trusted. Concatenating user text into a
  string and then declaring it trusted turns a safe value into a vulnerability. Interpolation in a template
  (`{{ name }}`) escapes for you; use it.
- `encodeURIComponent` encodes `/ ? # %` and spaces, so a file name stays one path segment. (The remaining edge is a name
  of just `..`, which the encoder leaves alone: the server must reject it too; the client is never the only defense.)

## The fix

```ts
// markdown.ts: escape first, then emit only the tags we own; links only for http(s)/mailto
return escapeHtml(source) /* ... */;
```
```html
<div class="preview" [innerHTML]="html()"></div>
<strong>{{ sharedBy() }}</strong> shared <em>{{ fileName() }}</em> with you
```
```ts
protected downloadUrl(file: string) { return `/api/files/${encodeURIComponent(file)}/download`; }
```

## Tradeoffs and discussion

- **Escape-then-format vs. sanitize-after-format:** escaping the source means raw HTML in notes is shown as text (a product
  decision; the Expected section of the ticket says so). Allowing HTML needs a real allowlist sanitizer. Angular's own
  sanitizer is a safety net, not a policy: it keeps whatever it considers harmless, not what *you* want to allow.
- **Own renderer vs. library:** a 20-line renderer is easy to review but accumulates edge cases (nesting, code spans). Fine
  for release notes; for user content use `marked` + a sanitizer.
- **Server side:** if this text is stored and shown elsewhere (emails, mobile), validating it only in this component is
  not enough.

## What a reviewer should say in the PR comment

> **Blocking:** four places turn untrusted text into trusted markup. (1) `nativeElement.innerHTML =` bypasses the
> sanitizer: bind `[innerHTML]`. (2) The renderer must escape the source and only emit `http(s)`/`mailto` links.
> (3) Do not build HTML in a string and `bypassSecurityTrustHtml` it: use interpolation. (4) `bypassSecurityTrustUrl`
> on a path built from a file name allows traversal: `encodeURIComponent` and a plain string. *Should-fix:* consider a
> maintained markdown library. *Question:* do we have a CSP in staging? I would feel better with `script-src 'self'`.
