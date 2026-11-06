# Security: a lesson before the exercises

This is a Part 2 topic, so the exercises ask for more than a fix. For every finding you also decide how bad it is and
write the comment you would leave on the pull request. Security findings are usually cheap to fix and expensive to miss,
which is why the dojo's study order starts here.

How to use it:

- Read one chapter, then do its exercise. Each chapter builds on the previous one.
- The examples use a library app (books, members, loans, shelves). They show the defensive idea and the Angular tool,
  never an attack you could copy.
- Each chapter ends with **review questions**. In security review the question behind all of them is "who outside my
  team can influence this value, and what can it reach?".

### Deciding how bad a finding is

The dojo uses four labels:

| Label | Meaning | Merge? |
|-------|---------|--------|
| **blocking** | Wrong behaviour, a security hole, data loss, or something expensive to undo later. | No, until fixed. |
| **should-fix** | A real defect or maintainability cost with a clear fix, not an emergency. | In this PR or a linked ticket. |
| **nit** | Taste or small polish. | Yes; keep them few. |
| **question** | You cannot tell if it is a problem, so you ask for the reason. | Depends on the answer. |

For a security finding, three factors decide the label, and you should be able to say all three in the comment:

1. **What the attacker gains.** Running code in someone else's session, reading a credential, changing data as someone
   else, or sending a user somewhere they did not mean to go are serious. Learning a version number is not.
2. **Who can trigger it, against whom.** Any anonymous visitor against every user is the worst case. A signed-in member
   against other members is close behind. Something only the victim can do to themselves, or only an administrator can
   do, is much narrower.
3. **Whether another layer still holds.** If the server rejects the request anyway, or a Content-Security-Policy would
   stop the script, the finding is real but its impact is smaller.

Two worked examples from a feature that is not in the exercises, the member's profile page:

- A member can put markup in their own "favourite quote" field, and it runs only on their own private settings page.
  The only person who can trigger it is the victim, against themselves (self-XSS). It is a real bug and worth fixing,
  usually a **should-fix**, rarely blocking. It moves up the moment that field is shown to anyone else, or if another
  bug lets an attacker write to it.
- An admin search page reflects the search term into the page without escaping, and only administrators can open it.
  The page is narrow, but the victims are the most powerful accounts, and an attacker only needs an administrator to
  click a crafted link. Most teams would call that **blocking**, and say why: "an attacker who gets one admin to open a
  link runs code with admin rights".

A good comment leads with that reasoning before the rule. "Any member can run script in every reader's session" tells the
author why the fix matters; "do not use `bypassSecurityTrustHtml`" only tells them what to delete.

---

## Chapter 0: what moved since Angular 17

Angular's security model has been the same since v2: values bound into the DOM are escaped or sanitized by default, and
you must opt out explicitly. The code around it moved.

| Area | Angular 17 | Angular 22.2.2 (verified in the installed package) |
|------|------------|------------------------------------------------------|
| HTTP setup | `provideHttpClient(...features)` already existed next to `HttpClientModule`. | `provideHttpClient(...)` with functional interceptors (`withInterceptors([fn])`) is the norm. XSRF protection is on by default, as it was in 17; `withXsrfConfiguration({ cookieName, headerName })` renames it, `withNoXsrfProtection()` turns it off. |
| HTTP backend | `XMLHttpRequest`. | `fetch` by default, and request options accept fetch's `credentials`, `referrer` and `referrerPolicy` next to the older `withCredentials`. |
| `DOCUMENT` | Only from `@angular/common`. | Exported from `@angular/core`, re-exported from `@angular/common`. |
| URL sanitizer | Rewrites unsafe URLs to `unsafe:...`. | Rewrites a `javascript:` URL to `unsafe:javascript:...` and warns in dev mode. |
| Trusted Types | Supported. | When the browser supports them, Angular creates two policies: `angular` for its own sanitized values and `angular#unsafe-bypass` for `bypassSecurityTrust*` HTML, script and resource URL values (style and URL bypasses get no policy). A CSP can allow the first and refuse the second. |
| CSP | `CSP_NONCE` token or `ngCspNonce` attribute (v16+). | Same, plus an experimental `security.autoCsp` option in the application builder that generates a hash-based strict CSP for `index.html` (default `false`). |
| SSR | `@angular/ssr` was new. | The builder's `security.allowedHosts` limits which hostnames the server application accepts. |

### Security contexts

The 22.2.2 `SecurityContext` enum has seven values: `NONE`, `HTML`, `STYLE`, `SCRIPT`, `URL`, `RESOURCE_URL` and
`ATTRIBUTE_NO_BINDING`. The compiler's security schema decides which bindings use which context. The ones you meet in
review:

| Context | Bindings that use it | What Angular does |
|---------|----------------------|-------------------|
| `HTML` | `[innerHTML]`, `[outerHTML]`, `iframe[srcdoc]` | Keeps a safe subset of elements and attributes; drops scripts and event handler attributes. |
| `URL` | `a[href]`, `area[href]`, `form[action]`, `[formAction]` | Leaves ordinary URLs alone, neutralizes `javascript:`. |
| `RESOURCE_URL` | `iframe[src]`, `embed[src]`, `object[data]`, `link[href]`, `base[href]` | Refuses anything not explicitly trusted, because the browser loads and runs what these point at. |
| `ATTRIBUTE_NO_BINDING` | `iframe` `sandbox`, `allow`, `allowFullscreen`, `referrerPolicy`, `csp`, `credentialless`, `fetchPriority`; SVG `animate`/`set` `attributeName`, `values`, `to`, `from` | Refuses a binding at all. These attributes change what the element is allowed to do, so they must be static in the template. |

Interpolation depends on where it appears. Between tags, `<p>{{ value }}</p>` sets a text node, so the browser never
parses the value as HTML. Inside an attribute, `href="{{ url }}"` is an attribute binding and goes through the same
sanitizer as `[href]="url"`.

---

## Chapter 1: trust boundaries and the sanitizer (exercise 01)

### The problem

Content that one person writes and many people read is the classic way into a web app. Whoever writes it gets to run
code in the session of everyone who views it: read what they can read, act as them, change what they see. The writer
does not need any special access, only a text field that someone else's browser will interpret.

### Sources, sinks, and the line between them

Every injection bug has the same shape. A value comes from a **source** someone else controls (another user, the
address bar, a partner API) and reaches a **sink** that interprets it (HTML parsing, a URL the browser loads or follows,
`eval`). The **trust boundary** is the line between values your team wrote and values anybody wrote. Review means
following each value across that line.

Here is the shape on a different feature, a member who embeds a reading-list video on their public profile:

```flow
Member pastes a video link -> API: stored as a string
API -> Public profile: shown to every visitor
Public profile -> Template binding: iframe src uses RESOURCE_URL
Template binding -> Browser: refused unless something vouched for it
```

Angular refuses the binding, which is the correct default: an `iframe` loads and runs whatever it points at, and no
sanitizer can make an arbitrary page safe.

### Choose the least powerful binding

Each binding can do less damage than the next one, so use the weakest one that renders what the feature needs:

```html
<p>{{ member.bio }}</p>                 <!-- text: shown literally, never parsed -->
<div [innerHTML]="member.bio"></div>    <!-- HTML: parsed, then reduced to a safe subset -->
```

If the bio is plain text, interpolation is the whole answer. `[innerHTML]` is for formatting you actually want to keep.

### `bypassSecurityTrust*` is a promise, not a filter

`DomSanitizer` has five bypass methods (`...Html`, `...Style`, `...Script`, `...Url`, `...ResourceUrl`). None of them
looks at the value. Each one marks it as "the author vouches for this", and the binding then skips sanitization. The
promise is only true when the value cannot be influenced from outside: a constant, or a string your code builds from
constants and pieces it has validated itself.

For the video feature, a defensible version vouches for a URL the code builds, never for the string the member pasted:

```ts
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

embedUrl(id: string): SafeResourceUrl | null {
  if (!VIDEO_ID.test(id)) return null;
  return this.sanitizer.bypassSecurityTrustResourceUrl(`https://video.example/embed/${id}`);
}
```

The host and path are constants; the only external piece is checked against a strict pattern first. If you need to clean a
value yourself, the method that sanitizes is `sanitizer.sanitize(SecurityContext.HTML, value)`.

When not to use a bypass: for anything a user, a partner or the address bar can influence, however many function calls
away. In review, every bypass call deserves one sentence from the author: who vouches, and why the value cannot change.

### Decide about URLs with the parser

Whenever code decides something about a URL (is it a web link, is it on our site, is its host allowed), the decision
belongs to the browser's URL parser, not to string methods. The WHATWG `URL` class is that parser, and it reads URLs very
differently from `startsWith` or a regular expression: it resolves protocol-relative addresses, treats a backslash like a
slash in web URLs, lower-cases schemes and hosts, and strips tabs and newlines. A string check and the browser can
therefore disagree about the same input, and the attacker picks the input where they disagree.

So the principle is: ask the browser's parser, then compare origins (or the scheme and host you care about). Note that
`new URL(value)` throws on input that is not a URL, so the code has to decide what a failure means.

### Links to the outside

The URL sanitizer stops `javascript:` from running, but leaves a link behind pointing at `unsafe:...`. For a feature that
links to user-supplied sites, ask which schemes it should support at all, and what it should show for a value outside them.

On `target="_blank"`, it helps to know the browser defaults behind `rel="noopener noreferrer"`. Current browsers apply
`noopener` to `target="_blank"` links by default, and the default `Referrer-Policy` (`strict-origin-when-cross-origin`)
sends only the origin to other sites. The attribute still protects old browsers and pages that loosened their referrer
policy.

### Review questions

- For each value bound into the template: who wrote it, and which security context does the binding use?
- Who outside your team can produce this value, directly or through something they control?
- Is this the least powerful binding that renders what the feature needs?
- Is any decision about a URL made with string methods instead of the parser?

**Now do exercise 01.**

---

## Chapter 2: credentials and what leaves the app (exercise 02)

### The problem

A credential is only as safe as the least careful place it reaches. Count the places a member's bearer token or personal
data can reach once it leaves the code that needed it, and the people who can read each of them. Whoever ends up holding
the token can act as the member until it expires, and whoever holds the data has something that never needed to leave the
app. None of them had to attack anything; the app handed it over.

### An interceptor is a global filter, so decide its scope

An `HttpInterceptorFn` registered with `withInterceptors([...])` runs for every request made through that `HttpClient`:
your API, a CDN, a map tile service, an analytics vendor. Whatever an interceptor adds, it adds everywhere, unless it
decides otherwise.

```flow
Catalog page -> Interceptor chain: GET a list of books from our API
Branch map widget -> Interceptor chain: GET tiles from a map vendor
Interceptor chain -> Every destination: whatever the interceptors add
```

So for each interceptor, the review question is about scope: which destinations should this apply to, and how does the
code know? A request-id header is harmless anywhere. A credential, an API key, or an internal tenant header should reach
exactly the destinations that need it. Decide by parsing the URL (chapter 1) and comparing it with the destinations
you mean, and think about what happens for a destination nobody listed yet.

Request options can widen what the browser sends on its own, too. `withCredentials: true`, or fetch's
`credentials: 'include'` (accepted by `HttpClient` request options in 22.2.2), tells the browser to attach that site's cookies to a
cross-origin request. On a request to someone else, that sends whatever cookies your users hold for that site. `referrer` and
`referrerPolicy` control how much of the current URL travels along.

### CSRF and the layers that stop it

Cross-site request forgery is a page on another site causing the browser to send a state-changing request to your API,
with your user's cookies. A bearer token in an `Authorization` header is not exposed to this, because only your code adds
it; cookies are, because the browser adds them.

The first layer today is the cookie's `SameSite` attribute. With `SameSite=Lax` (which Chromium-based browsers assume when
the attribute is missing; other browsers differ, so set it explicitly) or `Strict`, the browser does not attach the cookie
to cross-site `POST`, `PUT` or `DELETE` requests. With `SameSite=None` it does.

```flow
Library app -> Library API: same-site request carries the session cookie
Another site -> Library API: cross-site POST, cookie withheld if SameSite is Lax or Strict
Another site -> Library API: cross-site POST, cookie sent if SameSite is None
Library app -> Library API: state-changing request also carries X-XSRF-TOKEN
```

The XSRF token is the layer that still holds when `SameSite` does not help: cookies set with `SameSite=None` (common for
APIs on another domain), attackers on a sibling subdomain (they are "same-site"), and older clients. Angular's side of it,
verified in the installed `@angular/common` source:

- It is on by default with `provideHttpClient()`.
- It skips `GET` and `HEAD`, and skips requests whose URL resolves to another origin than the page.
- For the rest it reads the cookie `XSRF-TOKEN` and copies it into the header `X-XSRF-TOKEN`, unless the request already
  has that header.
- `withXsrfConfiguration({ cookieName, headerName })` only renames the two; `withNoXsrfProtection()` removes the defence.

The server sets the cookie and compares it with the header; another site cannot read the cookie, so it cannot produce the
header. This is also where severity moves: whether a missing layer is blocking depends on which of the other layers this
API actually has.

### Data that leaves through side doors

Logs, analytics events and error reports are sinks too. They are copied to other systems, kept for a long time, and read
by people outside the team. A useful habit is to log and send by **allowlist**: name the fields that help someone debug
or measure, and send only those, instead of dumping a request or an object and hoping it holds nothing sensitive. Every
field you log is data you now hold.

Where the app stores its token is a tradeoff between exposure to injected script and exposure to CSRF, and the right
answer depends on the app, so it is something to ask about.

### Review questions

- For each interceptor: which destinations does it touch, and what happens for a destination nobody listed yet?
- If this credential leaked, who would hold it and for how long?
- Which of your defences would still hold if the browser sent cookies cross-site?
- For every log line, event and error report: which fields could hold a credential or personal data? Would you paste
  this line in a ticket?

**Now do exercise 02.**

---

## Chapter 3: building markup from text (exercise 03)

### The problem

The attacker here does not need a form that renders HTML. They need a feature that turns their text into markup: a
mention that becomes a link, or a search term that becomes a highlight. Those features
build markup in code, and markup built in code often reaches the page through paths the template sanitizer never sees.

### The sinks Angular does not guard

Angular sanitizes template bindings. Anything that writes HTML into the DOM some other way is outside that protection:

- DOM APIs called directly: `insertAdjacentHTML`, `outerHTML`, `document.write`, and the `innerHTML` property of an
  element reached through `ElementRef` or `document`;
- `Renderer2.setProperty(el, 'innerHTML', ...)`, which forwards to the DOM;
- a third-party widget whose API takes an HTML string (a chart tooltip formatter, a rich-text editor's `setContent`);
- template strings compiled at runtime (see "What Angular does not protect you from" below).

Each hit in a review needs to show that the string is constant or already safe for the place it is written to.

### You rarely need an HTML string

Take a search page that highlights the matching part of each title. The first idea is a function that returns HTML. The
safer one returns data, and lets the template do the markup, where interpolation escapes every piece:

```ts
interface Part { text: string; match: boolean }

function splitByTerm(title: string, term: string): Part[] {
  if (!term) return [{ text: title, match: false }];
  const literal = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return title
    .split(new RegExp(`(${literal})`, 'gi')) // odd indexes are the matches
    .filter(text => text !== '')
    .map((text, i) => ({ text, match: i % 2 === 1 }));
}
```

```html
<h3>
  @for (part of parts(); track $index) {
    @if (part.match) { <mark>{{ part.text }}</mark> } @else { {{ part.text }} }
  }
</h3>
```

(The `filter` above shifts indexes when the title starts with a match; in real code, compute `match` before filtering.
The point here is the shape: text in, data out, markup in the template.)

### When a string is unavoidable: escape, then add your tags

Some APIs only take HTML strings. Then the rule is to escape the text for the context you write it into, before adding
any tags of your own, so that the only markup in the output is markup you wrote:

```ts
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const tooltip = (shelf: Shelf) => `<b>${escapeHtml(shelf.name)}</b><br>${shelf.bookCount} books`;
```

Order matters: escaping after adding tags escapes your own tags, and never escaping lets the text's `<`, `>` and quotes
become markup. "Escape for the context you write into" is the general rule. Element content needs `<` and `&` escaped;
an attribute value also needs the quote character that delimits it (`"` or `'`); a URL needs more than escaping, namely an
allowlist of the schemes your feature needs, because an escaped `javascript:` is still `javascript:`.

### Values inside URLs

A value placed in a URL can change what the URL means if it is not encoded for its position. Each part of a URL has its
own tool:

| Where the value goes | Tool |
|----------------------|------|
| A query parameter | `HttpClient`'s `params` option, `HttpParams`, or `URLSearchParams` |
| A path segment | `encodeURIComponent` |
| A whole URL that came from someone else | parse it with `URL` and check it (chapter 1) |

The server has to check the same values: the client is never the only defence.

### Review questions

- For each place text becomes markup: is the text escaped for the context it is written into, and before any tags are
  added?
- Which writes to the DOM happen outside a template binding?
- Could this feature return data and let the template render it?
- Who outside your team can produce the text that reaches this sink?
- If one of these defences failed, what would the next layer catch?

**Now do exercise 03.**

---

## What Angular does not protect you from

The sanitizer guards template bindings. These risks sit outside it, and they come up in reviews of any Angular app:

- **Route guards and hidden buttons are user experience, not authorization.** Anyone can call the API without the UI. The
  server decides who may read or change what; a `canActivate` only decides what the app shows.
- **Never build templates from user input.** Compiling a template string at runtime that includes user data lets that data
  run as Angular template code, and the sanitizer cannot help, because the attacker wrote the template. This is the first
  rule in the Angular security guide.
- **Everything in the bundle is public.** Keys in `environment.ts`, feature flags that hide admin screens, and internal
  URLs are all readable by anyone who opens the developer tools. Secrets belong on a server.
- **Third-party scripts and dependencies run with the page's full privileges.** An analytics snippet or a compromised
  package can read the DOM, tokens in storage and every request. The sanitizer does nothing for code you included on
  purpose; review new dependencies and scripts like code your team wrote, and use a CSP to limit where scripts come from.
- **Server rendering can put private data into the HTML.** The HTTP transfer cache serializes server responses into the
  page. By default it skips requests with auth headers or credentials; options such as `includeRequestsWithAuthHeaders`
  turn that off and write those responses into the page source. `security.allowedHosts` protects the server from
  forged hostnames; it does not decide what the page contains.

---

## After the lesson

For each exercise, write your list of findings before you open anything on the `solutions` branch, with a severity on each
and one line saying what the attacker gains, who can trigger it and which other layer still holds. Then compare with
`SOLUTION.md`. Where your label differs, work out which of the three factors you weighed differently. Rewrite your own
comment until it states the impact, the fix and anything you would not block on, in a few sentences.
