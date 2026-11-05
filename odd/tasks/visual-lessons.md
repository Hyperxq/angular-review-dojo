# Visual lessons

Objective: one `LESSON.md` per exercise topic (18 topics) plus a separate visual project that renders them.
Branch: `feat/visual-lessons` (dojo) and a new repo at `../angular-review-dojo-lessons`. Delivery: ask-on-risk. Runner: none
for lessons (passive docs, structural checks); Vitest via `ng test` in the visual project.

## Specs

- **S1 Lesson per topic.** "lo que me serviria es una contraparte a los ejercicios que sea en forma de \"tutorial\" y explique
  como un software craftsman a otro su pupilo." / "Me gustaria un tutorial por tema" / scope answer: "Los 18 temas".
  Each topic folder `src/app/exercises/<topic>/` gets `LESSON.md`, one chapter per exercise in exercise order.
- **S2 Angular 17 baseline, no React.** "no necesitas usar React como referencia, yo usaba Angular primero y lo deje en la
  version 17". Bridges go from Angular 17 to the installed Angular 22.2.2.
- **S3 Visual project.** "me gustaria que la leccion fuera visual, entonces si puedes usar la skill taste, Impeccable y
  emilkowalski genial para disenarla. Entonces crea los LESSON.md pero tambien crea un segundo proyecto en forma visual".
- **S4 Humanizer.** "Pasa todo el texto por humanizer" (every lesson and all visual-project copy).
- **S5 (assumption) No spoilers.** Lessons teach the concepts and tools, use a different domain in examples, and end each
  chapter with review questions; they never point at the exercise's defect.
- **S6 (assumption) Single source of truth.** The visual project renders the `LESSON.md` files (synced from the dojo); it
  does not duplicate their text. Visuals come from the lesson-markup contract below.
- **S7 (assumption) Artifacts in English.** Lessons, code and UI copy are English.
- **S8 Expert review per lesson.** "necesito que cada ves que termine una leccision lo pases por un subagente que evalue el
  contenido como un experto en el area lo haria. No unicamente en terminos de codigo sino entendiendo que nosotros
  resolvemos problemas y usar angular es una herramienta para solucionar dichos problemas". Each finished `LESSON.md` gets
  one read-only reviewer acting as a domain expert for that topic; it judges whether every chapter starts from the problem
  and treats Angular as the tool (when to use it, when not, tradeoffs), plus accuracy against Angular 22.2.2 and no spoilers.
  Findings get one correction batch by the original writer, then one recheck limited to those findings.

### Lesson-markup contract (shared by every lesson writer and the visual project)

- `# <Topic>: a lesson before the exercises` is the only H1. An intro, then `## Chapter 0: <title>` (what moved since v17 for
  this topic; omit only if nothing did), then `## Chapter N: <title> (exercise NN)` per exercise, `NN` = the folder's number.
- Each exercise chapter ends with `### Review questions` (bullets) and a final line `**Now do exercise NN.**`.
- Callouts use GitHub alerts: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`.
- Visual blocks are fenced code blocks with one of three info strings. They must read fine as plain text on GitHub.
  - ` ```marbles ` one stream per line: `label: timeline`. Label = text before the first `:`. Timeline chars: `-` one time
    frame, any single letter or digit = a value at that frame, `|` complete, `#` error, `x` cancelled/unsubscribed,
    spaces only for alignment before the first frame. All rows share the same time axis (same column = same moment).
    Optional trailing note after `  // `. Example:
    ```
    id$:     1-----2----------
    first:   --a---x            // cancelled by switchMap
    second:  ------------b|
    result$: ------------b----
    ```
  - ` ```flow ` one edge per line: `From -> To` or `From -> To: label`. Node names are free text without `->` or `:`.
  - ` ```tree ` an indented tree, two spaces per level; a trailing `[badge]` per node is optional (e.g. `ProductList [OnPush]`).
- Everything else is standard GitHub Markdown (tables, `ts`/`html` code blocks).

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S1 S2 S4 S5 S7 S8 rxjs (retrofit markup + humanizer), http-errors, architecture, capstone | delegated W6 (parallel) | done: review → correction → recheck → final correction | 1e813a8, 96b01e3 |
| T2 | S1 S2 S4 S5 S7 S8 rxjs-to-signals, change-detection, lifecycle | delegated W1 (parallel) | done: expert review rework → 1 correction batch → recheck approve; assess passive | 9ac3646 |
| T3 | S1 S2 S4 S5 S7 S8 routing, performance | delegated W2 (parallel) | done | 3f4eb85 |
| T4 | S1 S2 S4 S5 S7 S8 forms, directives, memory | delegated W3 (parallel) | done | b750239, 3f4eb85 |
| T5 | S1 S2 S4 S5 S7 S8 testing, security, ssr | delegated W4 (parallel) | done | 3f4eb85, f2a6f73 |
| T6 | S1 S2 S4 S5 S7 S8 a11y, state, di | delegated W5 (parallel) | done | 451f098 |
| T7 | S3 S4 S6 S7 visual project (+ design audit, reading mode, code blocks: L6–L10) | delegated W7 | in progress: base committed in sibling repo a14660e | |
| T8 | README pointer, commits | inline | done | 7c98bf7 |
| T9 | S8 expert review + correction per lesson (18 lessons) | delegated, one reviewer per lesson | done; every lesson passed review → correction → recheck (+ user-approved extra pass for ticket-retelling openings) | |

Route evidence: Writer trigger (a) parallelism. Seven independent units with disjoint edit surfaces (topic folders, a
separate repo), each well over 100 changed lines.

## Log

- L1 (2026-11-06) "me gustaria que la leccion fuera visual, entonces si puedes usar la skill taste, Impeccable y
  emilkowalski genial para disenarla. Entonces crea los LESSON.md pero tambien crea un segundo proyecto en forma visual"
- L2 (2026-11-06) Scope question answered: "Los 18 temas".
- L3 (2026-11-06) "Pasa todo el texto por humanizer"
- L4 Visual project stack: Angular 22 + bun (the learner practises the framework he is relearning), sibling repo
  `/Users/danielramirez/Documents/POC/angular-review-dojo-lessons`.
- L5 (2026-11-06) "necesito que cada ves que termine una leccision lo pases por un subagente que evalue el contenido como un
  experto en el area lo haria. No unicamente en terminos de codigo sino entendiendo que nosotros resolvemos problemas y usar
  angular es una herramienta para solucionar dichos problemas" -> added S8, T9.
- L6 (2026-11-06) Extra pass approved: "Una pasada más" for openings that retell ticket symptoms.
- L7 (2026-11-06) "la tipografia es dificil de leer" -> reading font Atkinson Hyperlegible Next (user choice); "ya usaste las skills…?" -> design audit with the three skills.
- L8 (2026-11-06) "el menu no esta alineado al header"; "el texto de la leccion lo es mas, entonces deberia ocupar el suficiente espacio para que sea leido de la mejor forma".
- L9 (2026-11-06) "me gustaria que hubiera un modo lectura, donde se esconda el header y el menu"; "voy a seguir necesitand los botones de siguiente y anterior"; explicit mode chosen.
- L10 (2026-11-06) "hay algo que no se que es que no me gusta del la parte del codigo" -> calmer code blocks, Atkinson Hyperlegible Mono.
- Dojo defects found (user decision pending): routing/05 and di/03 SOLUTION.md (+ di/03 HINTS footer) claim route providers are destroyed on exit (false in 22.2 without withAutoCleanupInjectors); routing/03 lacks TICKET.md and HINTS.md; lifecycle/README.md says ngOnChanges fires only for decorator @Input().
