# L3 - Hints

<details><summary>Hint 1 - nudge</summary>

Five small widgets, five different misunderstandings of when code runs. For each, write down: which hook (or function)
runs when, how many times, and what it can see.

</details>

<details><summary>Hint 2 - area</summary>

- When you override a lifecycle hook in a subclass, who runs the hook of the base class?
- What does Angular do with the promise returned by an `async ngOnInit()`? Where does the rejection go, and what does the
  template see in the meantime?
- An `effect` that copies one signal into another runs *later*. Which primitive gives you a writable signal that is
  already up to date when you read it?
- `afterNextRender` runs once. Which function re-runs a read/write whenever the signals it reads change?
- Does a base class buy anything here that `rxResource`/`toSignal` and `DestroyRef` don't?

</details>

<details><summary>Hint 3 - near the answer</summary>

Drop the base class. Lists: `rxResource({ params: () => this.category(), stream: ({ params }) => api.byCategory(params) })`
(`value()`, `isLoading()`, `error()`). Stock summary: `rxResource` too (or `toSignal`) and `computed` for the summary.
Price editor: `draft = linkedSignal(() => this.price())`. Text fit: `afterRenderEffect(() => { this.label(); this.width.set(measure()); })`.

</details>
