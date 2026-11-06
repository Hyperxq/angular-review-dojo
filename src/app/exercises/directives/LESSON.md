# Directives: a lesson before the exercises

A directive solves a narrow problem: you need behaviour on an element that someone else owns. The consumer writes the
`<button>` or the `<img>`, and your code adds lazy loading, a keyboard shortcut or a rule about who sees it. In v17 you wrote
them with `@Input()`, `@HostListener` and `ngOnInit`. The bugs you found in review were usually about lifetime: something the
directive started outlived it, or something it showed stopped following its inputs. Signal inputs, the `host` metadata,
`DestroyRef`, render hooks and effects make most of that declarative, as long as the directive uses them.

How to use this lesson:

- Read one chapter, then do its exercise. Each chapter assumes you finished the previous exercise.
- The examples live in a library (books, members, loans, shelves) and use different resources from the exercises on purpose.
  You learn each mechanism here and decide where it applies there.
- Each chapter ends with review questions. They are observations you can carry to any directive, not a checklist for one
  exercise.

## Chapter 0: what moved since Angular 17

### Before you write a directive

Three cheaper answers come first.

- Plain HTML and CSS. A `[class.on-loan]` binding in the template, the `title` attribute, the `popover` attribute, CSS anchor
  positioning and the native `<dialog>` element with `showModal()` and `inert` cover a lot of what used to need a directive.
- A component, when you need to own a template. An attribute directive adds behaviour to an element the consumer owns. A
  component owns its markup. If you are building DOM by hand inside a directive, you probably wanted a component.
- The Angular CDK, for problems that are hard to get right: overlays (`Overlay`, `CdkConnectedOverlay`), focus trapping
  (`cdkTrapFocus`), dialogs (CDK `Dialog`) and screen reader announcements (`LiveAnnouncer`).

Write your own directive when the behaviour is specific to your domain, small, and attached to elements you do not control.

### Inputs, outputs and models are functions

```ts
@Directive({ selector: '[appShelfLabel]' })
export class ShelfLabel {
  readonly code = input.required<string>({ alias: 'appShelfLabel' }); // InputSignal<string>
  readonly tint = input('#e8e0d0');                                   // optional, with a default
  readonly picked = output<string>();                                 // OutputEmitterRef<string>
  readonly expanded = model(false);                                   // two-way: [(expanded)]
}
```

You read a signal input by calling it: `this.code()`. Inputs are set after the constructor, while the parent renders. In the
constructor an optional input returns its default and a required one throws (`NG0950`). Read inputs only in reactive contexts
(a template, a host binding, a `computed`, an `effect`), or from `ngOnInit` onward for a one-off read. Reactive readers follow
every later change of the binding; a one-off read gets the value of that moment only.

Directives and components are standalone by default now, so `standalone: true` is no longer written.

### The `host` property

`@HostListener` and `@HostBinding` still exist, but the Angular guide recommends the `host` property of the decorator. It puts
every binding on the host element in one place:

```ts
@Directive({
  selector: '[appBookCard]',
  host: {
    role: 'article',                          // static attribute
    '[class.on-loan]': 'onLoan()',            // class binding, re-evaluated like a template
    '[attr.aria-busy]': 'loading()',          // attribute binding
    '(focusin)': 'select()',                  // listener on the host element
    '(window:resize)': 'measure()',           // listener on window
    '(document:keydown.escape)': 'close()',   // listener on document, with a key filter
  },
})
```

Angular adds listeners declared here when it creates the directive and removes them when it destroys it.

### Cleanup is registered where the thing is created

`inject(DestroyRef).onDestroy(fn)` replaces most `ngOnDestroy` methods. You call it right next to the code that starts
something, so a reviewer sees the start and the stop together. It returns a function that unregisters the callback, if you
ever need that.

### Render hooks and effects

- `afterNextRender(fn)` runs once, after the next render, in the browser only. It is the place for code that needs the element
  in the DOM or needs browser APIs. `afterEveryRender` (called `afterRender` before v20) runs after every render.
- `effect(fn)` is stable. It runs `fn`, records every signal `fn` read, and runs it again when any of them changes. Its callback
  receives `onCleanup`, which registers code to run before the next run and on destroy.

### Zoneless, again

Zoneless is the default since v21, and Zone.js is not installed here. Angular renders again when it is told something changed:
a signal read by a template changes, a template or host event fires, `markForCheck()` is called (the `async` pipe calls it for
you), `ComponentRef.setInput()` runs, or a view is attached. A directive that writes to `nativeElement` in its own code is doing
work Angular does not track. That was true in v17 as well: Zone triggered change detection, but it never re-ran a write you made
once in `ngOnInit`. When a value should follow an input, bind it through `host`.

## Chapter 1: what a directive starts, it stops (exercise 01)

### The problem

A directive instance lives exactly as long as its host element is in a view. When the view goes away (a route change, an `@if`
turning false) Angular destroys the directive and removes everything it manages: the host element, listeners declared in
`host`, bindings. It knows nothing about what the directive created through browser APIs.

```tree
App
  CatalogPage [route]
    img [host]
      LazyCover [directive]
  browser
    IntersectionObserver [created by LazyCover, held by the browser]
  document.body
    div [appended by hand, outside any view]
```

The two nodes at the bottom do not hang from the view, so destroying the view does not remove them. The browser keeps an
observer alive while it observes something. The document keeps a node it contains. Each needs explicit cleanup from the
directive that created it.

### A worked example: load a cover when it scrolls into view

```ts
@Directive({
  selector: 'img[appLazyCover]',
  host: { '[attr.src]': 'src()', '[attr.aria-busy]': '!src()' },
})
export class LazyCover {
  readonly url = input.required<string>({ alias: 'appLazyCover' });
  private readonly host = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly visible = signal(false);
  protected readonly src = computed(() => (this.visible() ? this.url() : null));

  constructor() {
    let observer: IntersectionObserver | undefined;

    afterNextRender(() => {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) this.visible.set(true);
      });
      observer.observe(this.host.nativeElement);
    });

    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}
```

Read it for its pairs. The observer is created in `afterNextRender`, because it is a browser API and the element must exist.
`disconnect()` is the handle that stops it, registered in the same constructor. The `src` follows both the input and the
visibility through a host binding, so a new `url` is picked up without any extra code.

Before writing this, check the cheaper answer: `<img loading="lazy">` does it natively for most cases. The directive earns its
place only if you need the visibility signal for something else.

### `textContent` and `innerHTML` are different contracts

In a template, `{{ title }}` is escaped and `[innerHTML]="html"` goes through Angular's sanitizer. Once you hold a DOM element
and write to it yourself, neither protection applies:

| Write | What the browser does with `'Dune <svg onload="steal(document.cookie)">'` |
|---|---|
| `el.textContent = text` | Shows those characters as text |
| `el.innerHTML = text` | Parses them as HTML, creates an `<svg>`, runs the handler |

If the text came from data (a book title, a member's note, anything a user could have typed somewhere), `innerHTML` is a script
injection point. When code builds DOM by hand, the default is `textContent`. Markup that must be rendered goes through a
template or an explicit, reviewed `DomSanitizer` decision.

### One-off reads versus bindings

```ts
ngOnInit() {
  this.host.nativeElement.setAttribute('aria-label', `Shelf ${this.code()}`); // one read, one write
}
```

That line runs once. If `code` changes later, the label keeps the first value, because nothing reactive read it. With
`'[attr.aria-label]': '"Shelf " + code()'` in `host`, Angular evaluates the expression while rendering, records that it read
`code`, and updates the attribute when `code` changes.

### When you would not write this

- Floating text next to an element: try `title`, the `popover` attribute or CSS anchor positioning, then CDK
  `CdkConnectedOverlay`. Hand-built positioned nodes in `document.body` are the expensive option.
- Announcing something to screen readers: use CDK `LiveAnnouncer` or one persistent live region that already exists in the
  page. A live region that is created and filled in the same tick is often not announced, because assistive technology watches
  for changes to a region it already knows. Pointing `aria-describedby` at an id that exists only while the element is focused,
  next to a live region, can be announced twice or not at all.
- If you do touch the document, inject it with `inject(DOCUMENT)` instead of the global `document`, so the code does not break
  under server rendering.

### Review questions

- For each element this code creates: whose child is it, and who removes it when the directive is destroyed?
- What outlives the directive? List everything the browser or the document still holds on its behalf after destroy.
- Where does each piece of text written to the DOM come from, and is it written as text or as markup?
- Could plain HTML, CSS or a CDK primitive do this job?

**Now do exercise 01.**

## Chapter 2: structural directives own a view container (exercise 02)

### The problem

Built-in control flow (`@if`, `@for`) replaced `*ngIf` and `*ngFor`, so most templates need no structural directive at all. A
custom one beats `@if` in two cases: the same rule is repeated across many templates and you want one place to change it, or
the directive provides a context the template uses (variables computed by the directive). Its costs are real: readers must look
up what the star does, and type narrowing in the template only works if you write template guards.

### What the star means

The `*` is sugar. These two templates are the same:

```html
<li *appCopies="book.copies; max 5; let n = index">Copy {{ n + 1 }}</li>

<ng-template [appCopies]="book.copies" [appCopiesMax]="5" let-n="index">
  <li>Copy {{ n + 1 }}</li>
</ng-template>
```

The expression before the first `;` binds to the input with the directive's selector name. Each `key value` after it binds to
an input named selector plus the capitalised key: `max 5` becomes `appCopiesMax`. Each `let x = y` declares a template
variable read from the view's context.

```tree
ng-template [appCopies]
  TemplateRef [what to stamp]
  ViewContainerRef [where to stamp it, the anchor after the template]
    embedded view 0 [context: index 0]
    embedded view 1 [context: index 1]
```

### The container is a list

The directive injects `TemplateRef` (the content under the `*`) and `ViewContainerRef` (the place to render it):

| Call | Effect |
|---|---|
| `createEmbeddedView(template, context?)` | Creates a view and appends it to the list |
| `clear()` | Destroys every view in the list |
| `remove(index)` | Destroys one view |
| `length` | How many views are in the list right now |

The container does what each call says and nothing more. Whatever the directive wants on screen, it has to reach through these
calls.

### Typing the context

The template type checker knows nothing about your context unless you tell it. Two static members do that:

```ts
interface CopiesContext {
  $implicit: number;
  index: number;
}

@Directive({ selector: '[appCopies]' })
export class Copies {
  readonly appCopies = input.required<number>();
  readonly appCopiesMax = input(10);

  static ngTemplateContextGuard(_dir: Copies, _ctx: unknown): _ctx is CopiesContext {
    return true;
  }
}
```

`ngTemplateContextGuard` types `let n = index`. A `static ngTemplateGuard_<inputName>` (for example
`ngTemplateGuard_appCopies: 'binding'`) tells the checker to narrow the template's types the way `@if` does. Without them,
the `let` variables are `any` and nothing is narrowed; the rest of the template is still type-checked.

### Keeping imperative work in step with signals

Turning state into views is imperative code, and imperative code that must follow signals is what `effect` is for. Here is the
shape on an unrelated target, keeping the page title in step with the open book:

```ts
constructor() {
  effect(() => {
    const title = this.book().title;                          // tracked: the effect re-runs when book changes
    untracked(() => {
      document.title = `${title} | ${this.library.name()}`;   // not tracked
      this.analytics.pageView(title);
    });
  });
}
```

`untracked(fn)` runs `fn` without recording what it reads. Put the reads that should trigger a re-run outside it and the
imperative work inside it. Otherwise any signal the imperative part happens to read becomes a trigger too, and the effect
re-runs for reasons nobody intended.

### When you would not write this

- A condition used in one template: write `@if`.
- A rule about who may see something: hiding UI by role is a convenience for the user, never authorization. The server must
  reject the request no matter what the template showed.

### Review questions

- When the condition changes from true to false and back, how many views does the container hold after each step?
- Is the condition evaluated once, or does it follow every signal it depends on?
- What has to be true before this code can run, and what guarantees it?
- Which reads should make this code run again, and which should not?

**Now do exercise 02.**

## Chapter 3: composing directives, effects that listen, and focus (exercise 03)

### The problem

A design-system team builds a shelf panel out of small reusable behaviours. The teams that use the panel see only its public
inputs and outputs, and they get whatever the composition exposes, including inputs they never asked for. Keyboard and
screen-reader users depend on the panel's behaviour without seeing any of its code.

### `hostDirectives` builds a component out of behaviours

A component can apply standalone directives to its own host element:

```ts
@Component({
  selector: 'app-shelf-panel',
  hostDirectives: [
    { directive: Collapsible, inputs: ['open'], outputs: ['toggled'] },
    { directive: Draggable, inputs: ['locked: dragLocked'], outputs: ['dropped: moved'] },
  ],
  template: `<ng-content />`,
})
export class ShelfPanel {}
```

```tree
app-shelf-panel [host element]
  ShelfPanel [component]
  Collapsible [host directive, public input: open, public output: toggled]
  Draggable [host directive, public input: dragLocked, public output: moved]
```

Only what you list becomes visible to users of `<app-shelf-panel>`. Each entry is `'innerName'` or `'innerName: publicName'`,
and the public name is what a parent binds: `<app-shelf-panel [open]="true" [dragLocked]="readOnly()" (moved)="save($event)">`.
Treat that list as the component's public API, because it is one. Read each name as a reader of the template would: when I bind
this, which directives receive it?

Composition has costs to weigh:

- Host directives are always instantiated. You cannot apply one conditionally.
- They are created before the host and run their lifecycle hooks before it.
- They must be standalone, and their selectors are ignored.
- Every input and output you expose is public API you will have to version.

The alternatives have their own costs. Inheritance shares code through a base class, which becomes fragile as soon as two
subclasses need different things from it. A wrapper component adds a DOM element, which can break layout and the accessibility
tree.

### An effect that listens

An `effect` starts from scratch on every run. Whatever one run sets up, `onCleanup` is where it is taken down, before the next
run and on destroy. Here is an effect that follows the system colour scheme only while the member chose "match my system":

```ts
effect((onCleanup) => {
  if (this.themeChoice() !== 'system') return;
  const query = this.document.defaultView!.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => this.dark.set(query.matches);
  apply();
  query.addEventListener('change', apply);
  onCleanup(() => query.removeEventListener('change', apply));
});
```

Two facts about `addEventListener` matter whenever you read code like this. It removes duplicates only when you pass the same
function object, and a new arrow function is a new object. And `removeEventListener` needs that same object back.

### Focus is state the user owns

Keyboard users depend on where focus is. A panel that takes focus (a dialog, a drawer, a menu) returns it when it closes, to
the element the user was on. A panel that keeps focus inside itself works on the elements that are there at the moment of the
key press. Any list of DOM elements derived from the panel goes stale as soon as control flow inside it adds or removes content.

```flow
open button -> panel: focus moves in when it opens
panel -> open button: focus comes back when it closes
```

If you write focus code by hand, a selector for focusable elements has to cover more than buttons and inputs: `select`,
`textarea`, `[contenteditable]` and `details > summary` are focusable too. An element you remembered may have left the DOM
since, so check `isConnected` before calling `focus()` on it.

### When you would not write this

- A modal: the native `<dialog>` with `showModal()` traps focus, makes the rest of the page inert and restores focus when it
  closes. CDK `Dialog` adds Angular integration on top.
- Focus trapping in a non-modal panel: CDK `cdkTrapFocus` (the `FocusTrap` service underneath) handles the edge cases.

### Review questions

- For each public input and output of this component: which directives does it reach?
- For each effect: what does one run create, and what removes it before the next run and on destroy?
- After the component is destroyed, is anything still listening on `document` or `window`?
- Where is focus before the panel opens, while it is open, and after it closes?
- Is any list of DOM elements computed once and used later, after the content could have changed?

**Now do exercise 03.**

## After the lesson

When you finish an exercise, read its `SOLUTION.md` on the `solutions` branch and compare it with your fix. Then write, in two
sentences, the comment you would leave on the pull request. If you cannot write it without looking, reread the chapter.
