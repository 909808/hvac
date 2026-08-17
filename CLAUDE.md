# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

A browser-based HVAC trainer: a ten-sector course (lessons → practice → gated checkpoint),
six generated drill labs, a physically-modelled Service Call simulator, and a career sim.
TypeScript, Vite, no UI framework, no backend. Everything runs client-side and persists to
`localStorage`.

A CompTIA Network+ (N10-009) track is still present but **archived** — it works, it keeps its
tests, and nothing there is maintained. Do not extend it unless asked explicitly.

## Commands

```bash
npm install          # once
npm run dev          # vite dev server on http://localhost:5173
npm run check        # tsc --noEmit && vitest run  ← run this before every commit
npm test             # vitest run (240 tests, ~2s)
npm run test:watch   # vitest watch
npm run typecheck    # tsc --noEmit
npm run build        # typecheck, then vite build to dist/
npm run package      # build, then fold dist/ into the single-file HVAC-Trainer.html
```

There is no linter and no CI config in the repo. `npm run check` is the gate.

`npx vitest run tests/career.test.ts` runs one file; `npx vitest run -t 'undercharge'` filters
by test name.

## Architecture

Dependencies point one way. Keep it that way:

```
engine/  ←  content/ , games/ , career/  ←  ui/
```

- **`src/engine/`** is track-agnostic. It contains no HVAC and no networking knowledge —
  only the content model, validation, grading, spaced repetition, session loop, sector
  gating and profile persistence. It imports from nothing else in `src/`.
- **`src/games/`** holds the simulation and generators. Pure functions over a seeded RNG;
  no DOM.
- **`src/career/`** is a pure state machine: every exported function maps one `CareerState`
  to the next. No DOM, no storage side effects (except `career/storage.ts`).
- **`src/content/`** is authored data only — questions, lessons, tracks, books.
- **`src/ui/`** is the only layer that touches the DOM, and the only one allowed to import
  from all of the above.

If a change wants `engine/` to know about refrigerants or jobs, the design has gone wrong.

### Layout

```
src/
  main.ts              Entry. Runs the content audit in DEV and mounts the app.
  engine/
    types.ts           Content model: tracks, domains, sectors, six question kinds, topology
    define.ts          defineQuestion + cite.*; the compile-time citation rule lives here
    validate.ts        Structural validation of questions/tracks/books
    lesson.ts          Lesson model, defineLesson, validateLessons
    grade.ts           Answer checking, partial credit, numeric tolerance
    srs.ts             SM-2 variant adapted to take credit in [0,1]
    select.ts          Exam paper construction, weighted by domain examWeight
    session.ts         The question game loop (class Session)
    progression.ts     Sector gating, checkpoints, lab unlocks
    profile.ts         Progress, mastery, localStorage persistence
    rng.ts             Seeded mulberry32; every generated item is reproducible
  games/hvac/
    refrigerant.ts     P-T tables, superheat, subcooling, condenser split
    psychrometrics.ts  ASHRAE Fundamentals equations — computed, never interpolated
    airflow.ts         Static pressure, fan laws, delta-T judgement
    system.ts          The split-system model and its nine faults
    servicecall.ts     Scenario generation, measurement costs, scoring
    drills.ts          The six generated drill families + GENERATORS map
  games/               ipv4.ts, subnet.ts, portrush.ts — archived Network+ generators
  career/
    types.ts           Ranks, tools, districts, jobs, CareerState (MINUTES_PER_DAY = 480)
    world.ts           6 districts, 5 ranks
    tools.ts           15 instruments, each mapped to the measurements it enables
    jobs.ts            43 job templates, availability rules, board generation
    career.ts          State machine: pay, reputation, days, promotion
    storage.ts         Career save/load
  content/
    tracks.ts          HVAC (10 sectors) and N10_009 (archived); domains and objectives
    books.ts           Registered books; citing an unregistered id is a validation error
    index.ts           ALL_QUESTIONS, ALL_LESSONS, auditContent(), contentStats()
    hvac/              sector-N-*.ts + sector-N-extra.ts (continuations), merged in index.ts
    hvac/lessons/      One file per sector
    network-plus/      Archived
  ui/
    app.ts             App shell: a plain class, full re-render on every state change
    dom.ts             h(), svg(), paragraphs(), appendInline() — the whole "framework"
    modes.ts           Mode definitions and session construction
    styles.css         CSS custom properties; warm dark default, light via prefers-color-scheme
    screens/           One module per screen, each exporting render*(ctx) → HTMLElement
    circuit.ts townmap.ts topology.ts   SVG renderers
scripts/package.mjs    Inlines the build into HVAC-Trainer.html
tests/                 7 files, 240 tests
```

### UI pattern

Screens are functions, not components: `renderHome(ctx)` takes a context object of readonly
data plus `onX()` callbacks and returns a detached `HTMLElement`. `App.render()` clears the
root and rebuilds the current screen. There is no diffing and no reactive state — at this
size, incremental updates would only add bugs. Follow the existing pattern rather than
introducing a framework or a state library.

Build DOM with `h()` from `ui/dom.ts`. Avoid `innerHTML` for anything that includes content
text; `appendInline()` renders the `**bold**` / `*italic*` subset as real nodes specifically
to avoid an injection path.

## Invariants the tests enforce

Breaking any of these fails `npm test`, and that is intentional — a trainer that teaches a
wrong diagnosis is worse than no trainer.

- **Citation rule.** `status: 'verified'` requires a real citation. Enforced twice: at compile
  time by `defineQuestion` (an item with `cite.todo(...)` will not typecheck as verified) and
  again in `validate.ts`. Draft items play in practice modes, badged `unverified`, and are
  excluded from exam/checkpoint selection.
- **Content validation has zero errors *and* zero warnings.** `tests/content.test.ts` fails on
  warnings too, so a short explanation or exam weights not summing to 100 will break the
  build.
- **Fault signatures.** Every fault in `games/hvac/system.ts` has a signature test in
  `tests/hvac-system.test.ts` pinning the direction of suction, head, superheat, subcooling
  and air ΔT. Undercharge vs. restriction is the pair that matters most: both drive superheat
  up, and **subcooling is what separates them**.
- **P-T anchors.** R-22 at 40 °F = 68.5 psig, R-410A at 40 °F = 118.5 psig, plus monotonicity
  and pressure↔temperature round-tripping.
- **Generated drills.** Every numeric generator must accept its own stated answer, and every
  generated question must file under a real domain and objective.
- **Career rules.** Every job's required sectors and tools must exist; each simulator
  measurement is enabled by exactly one tool; ranks get strictly harder; no job exceeds a
  480-minute day; a fresh career always has at least one takeable job on the board.
- **Lessons.** Table rows must match their headers, diagram links must point at nodes that
  exist, worked examples need an answer, no sector exceeds 40 minutes of reading.

## Adding content

**Read `CONTENT_GUIDE.md` first** — it is the authoritative guide and covers all six question
kinds, the lesson section types, topology diagrams and book registration. The short version:

1. Questions live in `src/content/hvac/sector-N-*.ts`. Add to whichever of the sector's two
   files is shorter, then append to that file's exported array. Nothing else needs wiring.
2. Ids are `<track>.<objective>.<slug>` and must be globally unique.
3. Write the explanation first. If three sentences of *why* are not available, the question is
   testing recall rather than understanding.
4. Fill in `whyWrong` wherever possible — the distractor explanations are where the learning
   is.
5. New content defaults to `status: 'draft'` with `cite.todo('…')`. Prefer
   `cite.standard(...)` for anything with a primary source (40 CFR Part 82 for EPA rules,
   ASHRAE Fundamentals for psychrometrics, OSHA 1910, NFPA 70E/54, ANSI/ASHRAE 15, or a stated
   derivation). **Never invent a page number to promote a draft.**
6. `npm test`.

Adding a sector also means an entry in `src/content/tracks.ts` (domain + sector, matching
ids) and an import in `src/content/hvac/index.ts`.

## Domain rules worth knowing before editing

- **Sector order is a dependency claim.** A sector opens only when the previous one is passed;
  there are no partial unlocks and no XP. Do not add an XP-like currency — its deliberate
  absence is a design decision documented in `career/types.ts`.
- **The curriculum is the career's tech tree.** Jobs gate on sectors passed, tools owned and
  standing earned. A blocked job must explain exactly which of the three is missing.
- **Tools are capabilities.** A measurement in the Service Call simulator is available only if
  a tool in the van enables it. `career/tools.ts` is the single mapping; a test asserts it is
  exactly one tool per measurement.
- **Scoring rewards evidence.** A correct diagnosis without the discriminating readings scores
  ~40% and is graded a lucky guess. Do not "fix" this.
- **Readings derive from one state.** The simulator computes every reading from the same
  underlying `SystemState`, so superheat from the gauges always agrees with the fault's
  signature. Never hand-write a reading alongside the model.
- **All HVAC values are US customary** — °F, psig, CFM, in. w.c., Btu/h. Temperatures in the
  model are in °F; gauge pressure is a display conversion.

## TypeScript and style

- Strict, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`. Practical consequences:
  indexed access needs a guard or `!`; an optional property must be omitted rather than set to
  `undefined` (see the conditional construction in `cite.book` / `cite.standard`); type-only
  imports need `import type`.
- Data is `readonly` throughout — interfaces use `readonly` fields and `readonly T[]`. Career
  and engine functions return new objects rather than mutating.
- `src/` imports use the path aliases `@engine/ @content/ @games/ @career/ @ui/`, declared in
  **both** `tsconfig.json` and `vite.config.ts` — add new aliases to both. Files import their
  own directory's siblings relatively (`./dom`, `../types`).
- **`tests/` imports relatively** (`../src/engine/grade`), not via aliases. Match that.
- Formatting is Prettier-like at ~100 columns: single quotes, semicolons, trailing commas,
  two-space indent. There is no config file; match the surrounding code.
- Comments explain *why*, not what, and are used generously at file and function level. The
  prose voice is plain and British-spelled in code comments ("behaviour", "penalised") while
  the trade content itself uses US terminology. Keep both.
- Section banners in longer files use the `// ---…---` rule style already present.

## Gotchas

- **`HVAC-Trainer.html` is a committed build artifact** — the double-clickable single-file
  build, ~620 KB. It does not regenerate itself. If a change affects what a user runs, run
  `npm run package` and commit the regenerated file; otherwise the download silently ships
  stale behaviour.
- **`scripts/package.mjs` must use function replacers in `String.replace`.** A replacement
  *string* treats `$$` as an escape, which previously ate every `$` in the game's currency
  formatting. The script asserts the bundle survives byte-for-byte and refuses to write if
  not. Do not simplify those calls.
- **Storage keys are legacy-named on purpose.** Profile: `hvac-trainer:profile:v3` (holding
  `version: 4` records — the key was not bumped because v3 saves migrate cleanly). Career:
  `hvac-trainer:career:v1`. Selected track: `netplus-trainer:track`. Renaming any of them
  wipes real user progress. Load paths swallow parse errors and fall back to an empty
  profile/career by design.
- **Content validation only runs automatically in DEV** (`main.ts` guards on
  `import.meta.env.DEV`) and in the test suite. The in-app Content Audit screen shows the same
  report.
- **Generated content is seeded.** Anything using `Rng` must stay reproducible from its seed —
  do not call `Math.random()` inside a generator or the career state machine.
- **Prose counts in `README.md` and `CONTENT_GUIDE.md` drift.** As of this writing the real
  figures are 325 questions total (268 HVAC — 76 verified, 192 draft — and 57 archived
  Network+), 15 lessons, 43 job templates, 15 tools, 6 districts, 5 ranks, 9 modelled faults
  plus healthy, 13 measurements, 240 tests. The README still says 41 jobs. Recompute from the
  source rather than trusting a sentence, and update the prose when a change moves a number
  it quotes.

## Working conventions

- Run `npm run check` before committing; both halves must pass.
- Commit messages in this repo are prose that explains the reasoning — a subject line in the
  imperative, then paragraphs covering why the change was made and what was learned, not a
  bullet list of files touched. Match that.
- Do not create pull requests unless asked.
- Leave the archived Network+ track alone unless the task names it.
