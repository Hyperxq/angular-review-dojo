# Profiling guide: finding leaks and long tasks in Chrome DevTools

This guide uses the three exercises of this topic as your lab. Panel and option names were checked against the Chrome
DevTools documentation on developer.chrome.com (memory problems, Performance panel reference, Performance monitor, heap
snapshots) at the time of writing. DevTools changes often: if a label differs in your version, the idea still applies.

Do the profiling on a **production-like build** whenever you can (`ng build`, then serve `dist/`), or at least reload with
DevTools open and extensions disabled. Dev builds add noise (the dev-mode second change-detection pass, source maps).

## The mental model: what is collectable and what is retained

The garbage collector frees an object when nothing **reachable** points to it. Reachable means: reachable from a *root*
(`window`, `document`, active timers, the Angular root injector, module-level variables, live event listeners).

```
root (window / timer list / root injector)
  -> source        (EventTarget, setInterval entry, root service, Subject)
    -> subscriber  (listener function, interval callback, Map entry, subscription)
      -> closure   (captures `this`)
        -> component instance
          -> its view, DOM nodes, other services...
```

A component is **retained** (a leak) when any link in that chain still exists after the component is destroyed. Fixing a leak
is always the same move: **cut the first link** (remove the listener, clear the timer, unsubscribe, delete the Map entry). Cutting
the last link (nulling a field) rarely helps.

| Collectable after destroy | Retained (leak) |
|---|---|
| `host: { '(window:resize)': ... }` listener (framework removes it) | `window.addEventListener('resize', arrowFn)` never removed |
| Timer cleared in `DestroyRef.onDestroy` | `setInterval` never cleared |
| `Map` entry removed on destroy | Root service `Map` holding the component |
| `takeUntilDestroyed` / `toSignal` subscriptions | `subject.subscribe(...)` on a root-level Subject |
| Detached DOM nobody references | Detached DOM referenced by a cache or a closure |

## Step 1: confirm there is a problem (Performance monitor)

1. Open DevTools, then the Command menu (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` elsewhere), type
   "Performance monitor" and choose **Show Performance monitor**.
2. Watch **JavaScript heap size**, **DOM Nodes** and **JS event listeners** (also CPU usage and Layout/sec).
3. Run the lab: open the app, go to *Memory and profiling > Viewport info (L1)*, then navigate to the home page and back. Repeat
   ten times.
   - A healthy page returns to the same numbers each time.
   - **JS event listeners** going up by a constant amount per visit (two per visit in L1) is the signature of a listener
     leak. **DOM Nodes** going up is a detached-DOM or retained-view leak. **JavaScript heap size** has a sawtooth shape (GC);
     look at the *floor* of the sawtooth, not the peaks.
4. Click the trash-can icon in the **Memory** panel or use **Collect garbage** (Performance panel) before comparing numbers, so
   you do not measure garbage that is simply waiting to be collected.

## Step 2: find what is retained (Memory panel, heap snapshots)

1. Open the **Memory** panel, choose **Heap snapshot** and press **Take snapshot** (take a first snapshot after the page loaded
   and the lab page has been opened and closed once, so one-off lazy initialisation is already in the baseline).
2. Perform the suspect operation several times (for L2: **Hide tiles / Show tiles** ten times).
3. Take a second snapshot. In the view drop-down choose **Comparison** and compare with the first snapshot.
4. Sort by **# Delta** (or **Size delta**). Types that grow by a multiple of your repetitions are the leak: in L2 you should
   see `ProductTile` growing by 12 per cycle.
5. Use the **Class filter** box to find your class by name (for example `ProductTile`, `ViewportInfo`, `FakeChart`). Angular
   keeps component class names in dev builds; in production builds names may be minified.
6. Select an instance and read the **Retainers** section at the bottom: it is the chain from a root to that object. Read it
   from the bottom up. The first entry that is *not* part of the component (a `Map` in `TileRegistry`, an event listener list, a
   `Timeout`) is the link to cut.
7. For DOM: in the **Summary** view, use the constructor filter *Objects retained by detached nodes*, or type `Detached` in the Class
   filter. A detached DOM tree is a subtree that is not in the document but is still referenced. Expand it, select a node and read
   its retainers: in L2 the path goes through `PreviewCache`.
8. Columns: **Shallow size** (the object itself) versus **Retained size** (everything that would be freed with it). Distance is the
   length of the shortest path from a root.

Optional profiles: **Allocation sampling** shows who allocates the most memory (use it for churn, not for leaks);
**Allocations on timeline** shows which allocations stay alive; the **Detached elements** profile lists detached DOM directly.

## Step 3: confirm the fix

Repeat Step 1 with the solution applied (`git diff main solutions -- src/app/exercises/memory/<exercise>`): the counters must be
flat across visits, and the comparison view must no longer show the class growing. The specs in each exercise encode the same
check (create and destroy N times, then count listeners, timers or registry size).

## Step 4: long tasks and forced reflows (Performance panel)

1. Open the **Performance** panel. Press **Record**, do the interaction (L3: type in "Filter regions"), then **Stop**.
2. Look at the **Main** thread track. A task longer than 50 ms is a **long task**: it is marked with a red triangle and the part
   beyond 50 ms is shaded red.
3. Click the task and use the **Call tree** tab (which root activities cause the most work) or the **Bottom-up** tab (which
   functions took the most time in aggregate). In L3 the top entry will be `StatsService.compute` called from the template of
   `SalesDashboard`.
4. Purple **Layout** and **Recalculate styles** events that repeat many times inside one task, each started by your own JavaScript,
   are layout thrashing (forced reflow): code alternating style writes with layout reads such as `offsetHeight`. DevTools may
   also warn about forced reflow on the event; the exact wording depends on the version.
5. Use **Clear recording** between experiments and use the **Collect garbage** button if you record memory (the "Memory" checkbox
   in capture settings adds a counter pane with JS heap, documents, DOM nodes and listeners).

## Step 5: Angular DevTools profiler (change detection)

The Angular DevTools extension (Chrome Web Store) adds an **Angular** tab. Its **Profiler** records change detection cycles: for each
cycle it shows which components were checked and how long each took. Use it with the *Change detection playground* exercise: a
healthy zoneless app shows few, short cycles, touching only the components whose signals changed. I did not verify the extension's
exact menu labels while writing this guide; start a recording, interact, stop, and read the bar chart per cycle.

## A checklist for a review

- Does anything start in the constructor/`ngOnInit` (listener, timer, subscription, `register`)? Where does it stop?
- Is a component, element or closure stored in something that outlives it (root service, static, module variable, `window`)?
- Is a cache bounded? What is its key's domain?
- Is expensive work inside a template call or an effect that re-runs?
- Is a layout property read after a style write in a loop?
