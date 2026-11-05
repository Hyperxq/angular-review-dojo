# Accessibility: a lesson before the exercises

You built Angular apps for years, so you have written your share of `(click)` handlers, custom dropdowns and modal
dialogs. Some of them probably worked well with a keyboard and a screen reader, and some only looked right. Accessibility
review is the skill of telling those two apart from the code, before an auditor or a customer does it for you.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples use a different domain on purpose: a library with books, members, loans and shelves. The lesson gives you
  the rules; the exercise asks you to find where they are broken.
- Every chapter ends with review questions. Some point at the exercise, others ask you to apply the same rule to a new
  case. Answer both kinds.

### Who you are reviewing for

Accessibility covers more people than screen reader users, and each group meets different failures:

| People | How they use the app | Failures they hit first |
|--------|----------------------|-------------------------|
| Keyboard and switch users (motor disabilities, a broken wrist, power users) | Tab, Enter, Space, arrows, Escape | Controls they cannot reach, focus they cannot see, actions that need dragging |
| Blind and partially sighted screen reader users | The accessibility tree, read aloud or in braille | Missing roles and names, changes that are never announced |
| Low-vision users | Zoom, magnifiers, Contrast themes | Low contrast, layouts that break at 400% zoom, information outside the magnified area |
| Colour-blind users | Their own eyes | Meaning carried only by colour |
| Deaf and hard-of-hearing users | Captions and transcripts | Audio and video with no text alternative |
| People with cognitive and learning disabilities | Everything above, plus patience and memory | Error messages that do not say how to fix the field, help that moves between pages, forms that ask for the same data twice, logins that depend on remembering or transcribing a code |

The last row is the one teams forget, and several WCAG 2.2 criteria (chapter 0) were written for it.

### Grading what you find

This is a Part 2 topic, so finding the problem is half the job. The other half is saying how bad it is and what you would
ask for, with the README's labels: **blocking**, **should-fix**, **nit** and **question**.

The first test is simple: can some group of people finish the task at all? If they cannot, the finding blocks the merge,
however small the diff that fixes it. After that, four questions settle the grade:

1. Who is blocked or slowed down? Name the group from the table.
2. From which task? Paying a fine matters more than reading a footer.
3. Is there a workaround they can reasonably find, such as another page that does the same thing?
4. Which WCAG criterion and level? A and AA failures are what audits and laws measure; AAA is advice.

Each chapter ends with a few graded examples from the library app. They show the reasoning, so you can apply it to the
exercise yourself.

## Chapter 0: what moved since Angular 17

### WCAG 2.2

WCAG 2.2 (published in October 2023) added nine success criteria and removed one, 4.1.1 Parsing, which modern browsers
made obsolete. The additions you will meet at level A and AA:

| Criterion | Level | What it asks |
|-----------|-------|--------------|
| 2.4.11 Focus Not Obscured (Minimum) | AA | The focused element is not **entirely** hidden by other content, such as a sticky header. (Fully visible is 2.4.12, AAA.) |
| 2.5.7 Dragging Movements | AA | Anything done by dragging can also be done with single clicks or taps. |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least 24 by 24 CSS pixels, or spaced so that a 24-pixel circle fits. |
| 3.2.6 Consistent Help | A | Help (contact link, chat) sits in the same place on every page that has it. |
| 3.3.7 Redundant Entry | A | Information already given in the same process is filled in or selectable, not typed again. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Logging in does not depend on a memory or transcription test, unless there is an alternative (paste allowed, password managers work). |

WAI-ARIA roles and states, the accessible name rules and the WAI-ARIA Authoring Practices patterns are the ones you knew.

### The Angular tools around it

| You wrote in v17 | You read in v22 | Why it matters for accessibility |
|------------------|-----------------|----------------------------------|
| `@ViewChild('x') x!: ElementRef` + `ngAfterViewInit` | `viewChild('x')` / `viewChild.required('x')`, a signal | The element you want to focus is a signal you can read when it exists. |
| `setTimeout(() => el.focus())` | `afterNextRender(() => el.focus(), { injector })` | Focus needs the element in the DOM. These hooks run after Angular has rendered. |
| (no equivalent) | `afterNextRender({ write: () => el.focus() })` | The phased form: Angular groups DOM reads and writes by phase (`earlyRead`, `write`, `mixedReadWrite`, `read`) to avoid layout thrashing. A focus call is a write. |
| `ngAfterViewChecked` with flags | `afterRenderEffect(() => …)` | Runs after render, and re-runs when the signals it read change (for example "the panel is now expanded"). |
| `@Input() expanded` + `@Output() expandedChange` | `expanded = model(false)` | Two-way expanded/collapsed state for widgets, written as one signal. |
| `@HostListener('keydown', ['$event'])` | `host: { '(keydown)': 'onKeydown($event)' }` | Same listener, declared in component metadata. The Angular style guide prefers it. |
| `import { DOCUMENT } from '@angular/common'` | `inject(DOCUMENT)` from `@angular/core` | Reading `document.activeElement` without touching the global. |

Two consequences of the v22 defaults are worth keeping in mind:

- This app is zoneless. A `setTimeout` still runs its callback, but nothing re-renders because of it. DOM work that must
  wait for the render belongs in `afterNextRender` or `afterRenderEffect`.
- `@if` adds and removes DOM. That matters for focus (an element that is removed loses focus) and for announcements
  (chapters 2 and 3).

> [!NOTE]
> Angular CDK (`@angular/cdk/a11y` with `FocusTrap`, `LiveAnnouncer` and `FocusMonitor`, plus `@angular/cdk/listbox` and
> `@angular/cdk/dialog`) and the Angular team's headless `@angular/aria` package are not installed in this repo. This
> lesson teaches the rules by hand so you can review any implementation, including one built on those libraries.

### How to test with real assistive technology

The exercise specs use a small helper, `src/app/core/a11y-queries.ts`, that finds elements by role and accessible name the
way a screen reader user would. It is a simplified model: it cannot judge contrast, target size or how a real screen
reader sounds. A review that claims "accessible" needs more than unit tests:

> [!TIP]
> - **Keyboard only.** Put the mouse away. Tab and Shift+Tab through the page; use Enter, Space, Escape and the arrow
>   keys where a widget expects them. Watch where the focus is at every step.
> - **The accessibility tree.** Chrome DevTools: Elements panel, Accessibility pane, and its full-tree view. Firefox: the
>   Accessibility Inspector. Compare each node's role, name and state with what you expected.
> - **Screen readers.** VoiceOver on macOS (Cmd+F5 to toggle; VO+U opens the rotor with lists of links, headings and form
>   controls). NVDA on Windows with Firefox or Chrome (Insert+F7 for the elements list). Turn on the screen curtain, so
>   you test by ear and not by sight.
> - **Automated checks.** axe DevTools or Lighthouse catch roughly a third of issues. A clean report is a start, never a
>   verdict.
> - **Low vision.** Zoom to 200% (1.4.4 Resize Text) and to 400% at 1280 pixels wide, where content should reflow into
>   one column without horizontal scrolling (1.4.10 Reflow). Try a Contrast theme on Windows, or emulate `forced-colors`
>   in DevTools.
> - **Motion.** Emulate `prefers-reduced-motion: reduce` and check that animations calm down.

## Chapter 1: roles, names and focus (exercise 01)

### The problem

For a keyboard or screen reader user, an interface that looks finished can be unusable: a control they cannot reach, a
list of identical "button, button, button", a page where they cannot see where they are. Accessibility is also a legal
requirement in many markets, which is why audit findings tend to arrive marked high priority. Most of these failures are
visible in the template, if you know what to read.

### The mental model: the accessibility tree

The browser builds a second tree next to the DOM, and assistive technology reads that one. Each node has a **role** (what
it is), a **name** (what it is called), and **states** (expanded, current, invalid). Styling does not enter it. An
element that looks like a link but is a `span` with a click handler is, in the tree, a piece of text.

Here is the pagination bar of the library's search results on page 2, the way a screen reader sees it when it is built
well:

```tree
navigation "Search results pages"
  link "Previous page"
  link "Page 1"
  link "Page 2" [current page]
  link "Page 3"
  link "Next page"
```

```html
<nav aria-label="Search results pages">
  @if (page() > 1) {
    <a [routerLink]="[]" [queryParams]="{ page: page() - 1 }">
      <svg aria-hidden="true">...</svg> Previous page
    </a>
  }
  @for (n of pages(); track n) {
    <a [routerLink]="[]" [queryParams]="{ page: n }" [attr.aria-current]="n === page() ? 'page' : null">
      Page {{ n }}
    </a>
  }
  ...
</nav>
```

Each line of the tree comes from a choice in the template: `nav` gives the landmark, `aria-label` names it (there may be
several navigations on the page), `a` with an `href` gives the link role, its text gives the name, and `aria-current`
gives the state. On page 1 there is no previous page, so there is no link to one.

### Native elements carry the contract

A native element brings its role, keyboard behaviour and focusability with it. A link is in the Tab order, activates with
Enter, and offers "open in new tab". A button activates with Enter and Space and respects `disabled`. Recreating any of that
on a generic element means adding a role, a `tabindex`, key handlers, and the details people forget (Space scrolls the page
unless you prevent it; a disabled state must also stop the handler).

Choosing between the two native elements is a review question in itself:

| If activating it... | Use | Because |
|---------------------|-----|---------|
| goes somewhere (a URL changes) | `<a href>` / `routerLink` | Users expect link behaviour: middle click, copy link, history. |
| does something on this page | `<button type="button">` | Users expect Space to work and no navigation. |

Do not reach for ARIA roles to fix a wrong element. `role="button"` on a link, or `role="link"` on a button, changes what
is announced and leaves the behaviour as it was.

### Where names come from

Assistive technology computes the accessible name in a fixed order. Simplified:

1. `aria-labelledby` (points at other elements by id),
2. `aria-label`,
3. the native labelling mechanism: `<label for>` or a wrapping `<label>` for inputs, `alt` for images, `<legend>` for
   fieldsets, `<caption>` for tables,
4. the element's text content, for roles such as link and button,
5. `title`, as a last resort.

A `placeholder` is not a label. HTML-AAM lists it only as a fallback name source when nothing else names the field, it
vanishes while the person types, and it often fails contrast.

Names come from content more often than you think, which gives you two rules of thumb:

- When visible text exists, let it be the name. Adding an `aria-label` that says something different breaks voice control:
  WCAG 2.5.3 Label in Name expects the spoken name to contain the visible one, because a voice user says what they see.
- Every control needs a name that makes sense when read alone. Screen reader users often browse a list of all links or all
  buttons on the page, with no surrounding context.

Images name whatever contains them. A book cover that is the whole content of a link names the link through its `alt`:

```html
<a [routerLink]="['/books', book.id]">
  <img [src]="book.coverUrl" [alt]="book.title" />
</a>
```

A purely decorative image takes `alt=""`, and a decorative inline SVG next to real text takes `aria-hidden="true"`, as in
the pagination bar. Without that, the screen reader reads both, or reads the file name.

In Angular, `[attr.aria-label]` and other `[attr.*]` bindings set an attribute, and binding `null` removes it. Static
values need no binding: `aria-label="Search results pages"`.

### Focus must be visible, and on screen

Keyboard users follow the focus indicator the way mouse users follow the pointer. Two criteria cover it: 2.4.7 Focus
Visible (there is an indicator) and 2.4.11 Focus Not Obscured (Minimum) (the focused element is not entirely hidden, for
example under a sticky header).

The browser draws an indicator by default. Styles can lose it in two ways: removing it, or covering it. A sticky header
that is 64 pixels tall can cover whatever the browser scrolls to the top edge when the user tabs backwards. One CSS line
tells the browser to leave room:

```css
html {
  scroll-padding-top: 72px; /* the sticky header's height plus a margin */
}
```

When a design wants custom focus styles, `:focus-visible` is the selector to style: the browser applies it when focus
should be shown, which in practice means keyboard use, and leaves mouse clicks alone. Removing the default without a
replacement is the change to look for in a diff.

### Contrast is an AA requirement

Text needs a contrast ratio of at least 4.5:1 with its background (3:1 for large text), under 1.4.3 Contrast (Minimum).
Meaningful non-text parts, such as input borders, icons and focus indicators, need 3:1 under 1.4.11 Non-text Contrast.
Both are AA. Measure with a tool, then grade by impact: a tool finding the problem says nothing about how bad it is.

### How bad is it?

Grade with the four questions from the intro. Two examples from the library app:

- **A library card login field that blocks pasting.** Who: people who use a password manager, which includes many people
  with memory or learning disabilities. Task: logging in, the door to everything else. Workaround: typing a 14-digit
  number from memory, which is exactly the test 3.3.8 Accessible Authentication (AA) forbids. Grade: **blocking**.
- **Due dates in light grey, at 3:1 against white.** Who: low-vision users, and anyone on a phone in sunlight. Task:
  knowing when a book is due. Workaround: zoom or a Contrast theme helps some; the date also appears in the reminder email.
  It fails 1.4.3 (AA). Grade: **should-fix**. If the date were very faint and shown nowhere else, it would be blocking.

Whatever the grade, name the person and the task in the comment: "a keyboard user cannot open a search
result" lands better than "missing role".

### Review questions

- Put the mouse away. Can every action that has a click handler be done with Tab, Enter, Space or the arrow keys?
- Open the accessibility pane for this component. Does each node's role and name match what a sighted user sees?
- A toolbar button shows only the text "More". What does a voice-control user say to press it, and what does a screen
  reader user hear in the list of buttons?
- Grade a tooltip that appears only on mouse hover and holds the only explanation of a late fee.
- After every Tab, can you see where the focus is, and is the focused element at least partly on screen?

**Now do exercise 01.**

## Chapter 2: widget contracts (exercise 02)

### The problem

Custom widgets are where accessibility breaks most often, and most expensively. A widget that looks like a familiar
control makes a promise to the user about keys, focus and announcements. When the promise is not kept, keyboard users get
stuck or lost, and screen reader users cannot tell what the widget is or what state it is in. These bugs survive manual
testing by sighted developers, because everything looks right.

### The mental model: a pattern is a contract

The WAI-ARIA Authoring Practices Guide (APG) writes the promises down as **patterns**. Each one has three parts:

1. roles and states the markup declares,
2. keys the widget handles,
3. rules for where focus goes.

A native element keeps its contract for you. A maintained library keeps most of it, if you use it as documented. A
hand-rolled widget keeps it only if all three parts are written. That gives a ladder, and the first question for any
custom widget is why it is not one rung higher:

| Need | Native element | Maintained primitive (not installed here) | Hand-rolled |
|------|----------------|--------------------------------------------|-------------|
| Choose one option from a short list | `<select>` | `@angular/cdk/listbox`, `@angular/aria` | the listbox or combobox pattern, plus a contract test |
| Show and hide a section | `<details>` / `<summary>` | `@angular/aria` | the disclosure pattern |
| A modal step that blocks the page | `<dialog>` with `showModal()` | `@angular/cdk/dialog`, `FocusTrap` from `@angular/cdk/a11y` | the dialog pattern, plus a contract test |
| A date | `<input type="date">` | a maintained date picker | the date picker pattern, one of the hardest |

A design that a native element cannot meet is a real reason to climb down the ladder. Styling `<select>` used to be the
classic one; customizable select (`appearance: base-select` in CSS) is changing that, currently only in Chromium-based
browsers.

### Reading a pattern: tabs

The library's book page has three tabs: Summary, Reviews, Availability. This is the tabs pattern from the APG:

```tree
tablist "Book details"
  tab "Summary" [selected]
  tab "Reviews"
  tab "Availability"
tabpanel "Summary"
```

Roles and states: `role="tablist"` on the container, `role="tab"` with `aria-selected` and `aria-controls` on each tab,
`role="tabpanel"` with `aria-labelledby` on the panel.

Keys:

| Key | Does |
|-----|------|
| `Tab` | moves into the tab list (to the selected tab), then out to the panel |
| `ArrowRight` / `ArrowLeft` | moves to the next or previous tab, wrapping |
| `Home` / `End` | first or last tab |

Focus: only the selected tab is in the Tab order. This technique is called a **roving tabindex**: one item has
`tabindex="0"`, the others `tabindex="-1"`, and arrow keys move both the focus and the `0`.

```ts
protected onKeydown(event: KeyboardEvent, index: number) {
  const last = this.tabs().length - 1;
  const next =
    event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
    : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
    : event.key === 'Home' ? 0
    : event.key === 'End' ? last
    : null;
  if (next === null) return;
  event.preventDefault(); // Home and End would scroll the page
  this.selected.set(next);
  this.tabButtons()[next].nativeElement.focus();
}
```

This code uses automatic activation: moving to a tab shows its panel. The APG recommends manual activation (arrows move
focus, Enter or Space shows the panel) when showing a panel is slow, for example when it loads data.

Some patterns more often use the other technique: real focus stays on one element, and `aria-activedescendant` names the
item that is active. Both are valid. What breaks is mixing them, or using neither, so find out which one the author
intended and check it end to end.

Tabs are the wrong tool when people need to compare the content of two panels, or read it in order. Headings in one long
page serve them better.

### Focus is something you move on purpose

Whenever a widget removes the element that has focus, or shows new content the user must deal with first, the code
decides where focus goes. If it decides nothing, focus falls back to the `body` and the next Tab starts from the top of
the page.

A small case from the book page: an "Edit title" button swaps the title for an input. Enter saves, Escape cancels, and
either way the input disappears.

```flow
Edit title button -> Title input: focus moves in when editing starts
Title input -> Title input: Enter saves, Escape cancels
Title input -> Edit title button: focus returns when editing ends
```

The timing rule applies to every focus move: the target must exist before you focus it. The button lives inside an `@if`,
so it is destroyed while editing and created again afterwards. Setting the signal does not create it; the next render
does. Wait for that render:

```ts
protected stopEditing() {
  this.editing.set(false);
  afterNextRender({ write: () => this.editButton()?.nativeElement.focus() }, { injector: this.injector });
}
```

The `injector` is there because a click handler runs outside the injection context.

A modal dialog applies the same idea at full strength. Its APG contract: a `dialog` role with `aria-modal="true"` and a
name; focus moves inside when it opens; Tab and Shift+Tab stay inside; Escape closes it; focus returns to whatever opened
it. The native `<dialog>` opened with `showModal()` covers most of that, and current browsers restore focus when it
closes. With `showModal()`, Tab can leave the page for the browser's own toolbar instead of wrapping as the APG describes.
That is browser behaviour and acceptable, so a reviewer should not ask for a hand-rolled trap on top of it. You still name
the dialog and choose where focus starts. A hand-rolled modal owes every line of the contract in code.

Before reviewing a modal at all, ask whether the step should block the page. For reversible actions, an inline
confirmation or an "Undo" message is often kinder to everyone.

### Descriptions, validity and announcements

A field can carry more than its name. `aria-describedby` points at extra text that is read after the name, such as a
format hint:

```html
<label for="isbn">ISBN</label>
<input id="isbn" aria-describedby="isbn-hint" />
<p id="isbn-hint">13 digits, without dashes.</p>
```

The same attribute can point at any message that belongs to the field, and it accepts several ids separated by spaces.
`aria-invalid="true"` exposes the field's validity state. Set it once the value has been checked; marking an untouched
field as invalid is noise.

Text that appears later is a separate problem: a screen reader does not notice new content on its own. A **live region**
is an element whose changes are announced. There are two common roles. `status` is polite and waits for a pause.
`alert` is assertive and interrupts. A `status` container is announced reliably only when it already exists before its
text changes. An `alert` inserted together with its text is usually announced, which is part of why it exists. Chapter 3
goes deeper.

### How bad is it?

Grade with the four questions from the intro. Two examples from the library app:

- **Rearranging a shelf display only by drag and drop.** Who: keyboard users and people with limited fine motor control.
  Task: for the librarian whose job this screen is, the main one. Workaround: none in the app. It fails 2.5.7 Dragging
  Movements (AA). Grade: **blocking**.
- **A "Book reserved" message that disappears after three seconds.** Who: screen magnifier users, who may be looking at
  another part of the screen, and slow readers. Task: confirming a reservation. Workaround: the reservation appears in
  "My loans". Grade: **should-fix**, or a **question** about why it needs to disappear at all.

### Review questions

- For one custom widget in the exercise, write its contract (roles and states, keys, focus) next to the template and
  compare line by line.
- What would a native element cost here? If native does not fit, why not a maintained library?
- A toast library announces every message assertively. When is that wrong, and for whom?
- Your team uses `<dialog>` with `showModal()`, and a reviewer asks for a hand-rolled focus trap on top. What do you
  answer?
- Whenever something appears or disappears, where is focus afterwards, and who decided?

**Now do exercise 02.**

## Chapter 3: changes without a page load (exercise 03)

### The problem

People who navigate without seeing the whole page, through a screen reader or a magnifier that shows a small part of it,
rely on the app to tell them where they are. A single-page app changes large parts of the screen without the browser's
help, so whatever the browser used to tell them now depends on code someone remembered to write. When that code is
missing, they lose their place, and nothing on a screenshot shows it.

### The mental model: replacing content means answering "what is this, and where am I?"

A full page load answers those two questions for the user without anyone writing code for it. Ask, for any change that
replaces the main content of a single-page app: what did the browser do here that the app now has to do itself? Chapter
2's timing rule still holds for anything that involves focus: the target must exist first.

Titles are a router concern in Angular: the router owns a `TitleStrategy` that writes the document title after each
navigation. Find where the app configures it, and what it does for each route, before you decide whether titles are
right.

Mapping the rest to the router (which event, which element, which moment) is the exercise's job.

### Live regions, in depth

Not every change deserves moving focus. "Draft saved at 10:42" should be heard without taking the user away from the field
they are typing in. That is a live region's job, and chapter 2's rule applies: a `status` region must exist before its
text changes, because the screen reader starts watching it when it appears.

```tree
form "Write a review"
  textbox "Your review"
  status "Draft saved at 10:42" [polite]
  button "Publish"
```

Choose the politeness by asking what the user loses if the message waits: nothing, for a saved draft; something real,
for a payment that failed.

Live regions are easy to overuse. Announcing every keystroke, or every percent of an upload, makes the screen reader
unusable. Before adding one, ask what is worth announcing: what does the user need to know, in how many words, and how
often?

### Colour cannot be the only channel

WCAG 1.4.1 Use of Color (A): information carried by colour needs a second channel. The library's due-date calendar marks
overdue days in red; colour-blind users, people using a Contrast theme (where `forced-colors` replaces the page's
colours), and screen reader users all lose that information.

The second channel can be:

- text, visible or in the accessible name;
- shape, such as an icon with a distinct outline;
- pattern, such as hatching in a chart;
- position, such as a separate "Overdue" group.

Which one fits depends on the layout. Weigh them for a dense table where every cell is small, and for a chart with five
series: what fits in the space, what survives a Contrast theme, and what a screen reader can read.

Colour on its own is fine when it repeats information already present in another form, or when it is decoration.
Meaningful shapes still need 3:1 contrast with their surroundings (1.4.11, AA).

### How bad is it?

Grade with the four questions from the intro. Two examples from the library app:

- **An infinite-scroll catalogue whose footer, with the only "Contact a librarian" link, can never be reached.** Who:
  keyboard users, and anyone who needs help, including people with cognitive disabilities. Task: getting help. Workaround:
  the help link is on other pages, in a different place, which also fails 3.2.6 Consistent Help (A). Grade: **blocking**
  on the catalogue, where people most need help finding books.
- **A banner of new arrivals that rotates every five seconds with no pause button.** Who: screen reader users (the content
  changes under them), people with attention disorders, low-vision users reading slowly. Task: browsing new books, which
  is optional. Workaround: the "New arrivals" page lists the same books. It fails 2.2.2 Pause, Stop, Hide (A). Grade:
  **should-fix**, with the workaround in the comment.

Some of these behaviours vary between screen readers. Say what you checked manually and what you could not.

### Review questions

- For each change in the exercise that replaces content: what would a page load have done here, and which of those
  things does the code do?
- A search result count updates while the user types. Announce it on every keystroke, after a pause, or never? Why?
- Grade a chart whose series differ only by colour, first in a report read once a year, then in a dashboard used daily.
- Take a grayscale screenshot and turn off the screen. Is any information lost?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch. Compare its severity table with yours
before you compare fixes: disagreeing about whether something blocks is the most useful disagreement to have. Then write
the PR comment in two or three sentences, each starting with its label and naming the person who gets stuck and the task
they cannot finish.
