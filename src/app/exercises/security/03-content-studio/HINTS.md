# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

There are three components and three different ways to get untrusted text into the page. For each, find where the
text meets a DOM sink (`innerHTML`, `href`) and what stands between them.

</details>

<details><summary>Hint 2 - area</summary>

- `nativeElement.innerHTML = ...` writes to the DOM directly. Which Angular protection does it skip? What is the
  Angular way to put HTML in an element?
- A tiny markdown renderer produces HTML from text. Does it escape `<` and `"` before adding its own tags? What is
  a URL that is safe in `href`?
- `DomSanitizer` is not a tool for building HTML strings. When you need to put a name inside a sentence, which Angular
  syntax escapes it for you?
- A file name is a **path segment**. Which standard function makes any string safe to use as one?

</details>

<details><summary>Hint 3 - near the answer</summary>

Escape `& < > "` in the markdown source before the inline rules run and only emit links for `http:`, `https:` or
`mailto:`; compute the HTML in a `computed` and bind it with `[innerHTML]` (the sanitizer is the second line of
defense). Build the banner with a template: `<strong>{{ sharedBy() }}</strong> shared <em>{{ fileName() }}</em>`.
Use `` `/api/files/${encodeURIComponent(file)}/download` `` as a plain string in `[href]`.

</details>

---

Tests won't catch the two things that need a policy decision: whether the editor should support HTML at all (it
silently drops it after the fix) and the absence of a Content-Security-Policy. Both are in `SOLUTION.md`.
