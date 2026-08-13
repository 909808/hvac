# Adding content

Everything in this guide assumes you have a book open next to you. That is the point —
the app is built so that transcribing from a real source is the easy path and inventing
things is the awkward one.

**HVAC** is the active track: ten sectors, each with lessons and a gated checkpoint. The
CompTIA Network+ track is archived — still present, not maintained.

There are two kinds of content: **lessons** that teach, and **questions** that test. Both
go through the same citation discipline and the same validator.

---

## The one rule

**A question is `verified` only if it cites something.** Enforced at compile time: TypeScript
rejects `status: 'verified'` alongside `cite.todo(...)`. Everything else follows from that.

Three citation forms, in descending order of how much you should trust them:

```ts
cite.standard('RFC 2131 §4.3.1')      // a primary source — best
cite.book('meyers-9e', '312-314')     // a study guide, with a page — good
cite.generated('subnet:vlsm')         // computed, nothing to cite — for generators only
cite.todo('Check against ch. 7')      // no citation — forces status: 'draft'
```

Prefer `cite.standard` when the fact has a primary source. The 80% cylinder fill limit is
in 40 CFR Part 82; you do not need a textbook to tell you that, and the regulation will
still say it in ten years. Use `cite.book` for anything that is a study-guide framing
rather than a specification — condenser split ranges, "check the filter first", the
troubleshooting habit.

---

## Your first question

Questions live in `src/content/hvac/sector-N-*.ts`. Open the file for the sector, copy an
existing entry, and change it.

```ts
import { cite, defineQuestion } from '@engine/define';

const subcoolTarget = defineQuestion({
  // Convention: <track>.<objective>.<slug>. Must be unique across the whole app.
  id: 'hvac.4.3.subcooling-target',
  track: 'hvac',
  domain: '4.0',              // sector
  objective: '4.3',

  kind: 'choice',
  difficulty: 2,              // 1 recall · 2 applied · 3 analysis

  prompt: 'You are charging a TXV system. Which reading do you charge by?',
  choices: [
    'Subcooling',
    'Superheat',
    'Suction pressure',
    'Head pressure',
  ],
  answer: 0,

  // Optional: why each distractor is wrong. Shown under that choice on reveal.
  // This is the single highest-value field in the whole schema — see below.
  whyWrong: {
    1: 'A TXV holds superheat constant regardless of charge, so it tells you nothing.',
    2: 'Suction pressure varies with indoor load and airflow, not just charge.',
  },

  explain:
    'A TXV modulates to hold superheat at its setting — add refrigerant and it throttles ' +
    'back, remove some and it opens. Superheat barely moves, so it cannot indicate charge. ' +
    'Subcooling can, because excess refrigerant has to stack somewhere and the condenser ' +
    'is where it goes. Target is typically 8–12°F; check the nameplate.',

  source: cite.todo('Confirm against the charging chapter of your text.'),
  status: 'draft',
});
```

Then add it to the export at the bottom of the file:

```ts
export const SECTOR_4_QUESTIONS: readonly Question[] = [
  meteringComparison,
  // …
  subcoolTarget,          // ← here
];
```

Run `npm test`. Done.

---

## What makes a question worth having

The bar is not "is it accurate" — the validator and your book handle that. The bar is
**does answering it teach you something you did not already know.**

**Write the explanation first.** If you cannot write three sentences explaining why the
answer is the answer, the question is testing recall of a fact rather than understanding
of a mechanism, and it will not survive contact with an exam that asks scenario questions.

**Make the distractors plausible.** The wrong answers are where the learning is. A
question whose three wrong options are obviously wrong teaches nothing; one where the
wrong option is the thing you would have reached for teaches a great deal. Draw distractors
from real confusions — undercharge vs. restriction, low airflow vs. low charge, auxiliary
vs. emergency heat, superheat vs. subcooling subtraction order.

**Fill in `whyWrong` when you can.** This is where a practice-test book earns its price —
the explanations of *why each distractor fails* are exactly this field, and transcribing
those is worth more than another hundred prompts.

**Say why, not just what.** "Target airflow is 400 CFM per ton" teaches a number. "Less air
means a colder coil, which condenses more moisture — right for Houston, wrong for Phoenix"
teaches you to make the call yourself.

---

## The six question types

### `choice` — one right answer

```ts
kind: 'choice',
choices: ['a', 'b', 'c', 'd'],
answer: 1,                      // index, validated in range
whyWrong: { 0: '…', 2: '…' },   // optional, keys must not be the answer
```

### `multi` — select all that apply

```ts
kind: 'multi',
choices: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'],
answers: [0, 1, 2],             // at least one, and never all of them
```

Graded with partial credit — over-selecting is penalised as well as missing.

### `input` — type the answer

```ts
kind: 'input',
accept: ['traceroute', 'tracert'],   // all accepted spellings
placeholder: 'command name',
```

Compared case-insensitively with whitespace collapsed. List every reasonable spelling; a
correct answer rejected on a technicality is worse than no question.

For a **calculated** answer, set a numeric tolerance instead of enumerating strings:

```ts
kind: 'input',
accept: ['118.5'],     // the computed value
tolerance: 3,          // ±3 accepted
placeholder: 'psig',
```

Grading parses the response as a number, so `118.5`, `119`, `118 psig` and `1,185` written
as `1185` all behave sensibly. Set the tolerance to whatever a careful technician reading a
gauge and a chart would actually land within — demanding an exact decimal fails people who
did the work correctly.

### `order` — put in sequence

```ts
kind: 'order',
steps: ['Identify the problem', 'Establish a theory', '…'],   // authored in correct order
```

The UI shuffles them. Graded on how many land in the right position.

### `match` — pair them up

```ts
kind: 'match',
pairs: [
  ['RPO', 'How much data loss is acceptable'],
  ['RTO', 'How long the service may stay down'],
],
```

**Right-hand items must be unique.** If two pairs share a right-hand value the mapping is
ambiguous and there is no single correct answer — the validator rejects it. (This caught a
real mistake during development: an 802.11 question had both `802.11a` and `802.11ac`
mapping to "5 GHz only".)

### `hotspot` — click the component on a diagram

```ts
kind: 'hotspot',
topology: cycleDiagram,        // required for this kind
prompt: 'Click the component where heat is absorbed from the space.',
answer: 'evap',                // a node id, validated to exist
whyWrong: {
  cond: 'The condenser REJECTS heat. It is the opposite end of the job.',
  comp: 'The compressor raises pressure; it does not absorb heat from the space.',
},
```

Asking "where is this in the system?" is a different skill from naming it, and it is the
one that matters when you are stood in front of the equipment. Needs at least three nodes
so it is not a coin flip, and the tests require most wrong picks to be explained.

---

## Topology diagrams

Scenario questions can carry a diagram. Nodes sit on a grid; the renderer handles layout.

```ts
topology: {
  caption: 'Branch office — PC-A cannot reach the internet',
  nodes: [
    { id: 'rtr', kind: 'router', label: 'RTR-1', sublabel: '10.10.10.1', col: 0, row: 1 },
    { id: 'sw',  kind: 'switch', label: 'SW-1', col: 1, row: 1 },
    { id: 'pc',  kind: 'pc', label: 'PC-A', col: 2, row: 1, state: 'warn' },
  ],
  links: [
    { from: 'rtr', to: 'sw' },
    { from: 'sw', to: 'pc', state: 'warn', label: '100 Mb' },
  ],
}
```

HVAC node kinds: `compressor` `condenser` `evaporator` `metering` `fan` `blower` `furnace`
`boiler` `pump` `damper` `thermostat` `accumulator` `sensor` `controller`.
(Networking kinds are also available for the archived track.)
States: `ok` `warn` `down`.

**Mark the symptom, not the cause.** Colouring the actual faulty device gives the answer
away. In the branch example above, PC-A is marked `warn` because that is where the user
reported a problem — the cause is its default gateway setting, which the diagram does not
show at all.

---

## Registering a new book

Before citing a book, add it to `src/content/books.ts`:

```ts
export const MY_BOOK = defineBook({
  id: 'shortname-1e',
  title: 'Full Title',
  authors: ['Author Name'],
  edition: '1st',
  isbn13: '9781234567890',
  publisher: 'Publisher',
  targets: 'N10-009',        // warns if it does not match the track revision
});
```

and append it to the `BOOKS` array. Citing an unregistered id is a validation error — which
is the point: a typo in a `book:` field would otherwise produce a citation nobody can check.

---

## Promoting a draft to verified

The Content Audit screen in the app lists every item awaiting a citation. For each one:

1. Find the topic in your book.
2. **Read it and check the question is actually right.** This is the real work. If the book
   disagrees with what is written here, the book wins — fix the content.
3. Swap the source and flip the status:

```diff
-  source: cite.todo('Confirm against the change management section.'),
-  status: 'draft',
+  source: cite.book('lammle-6e', '441-443'),
+  status: 'verified',
```

4. `npm test`.

Draft items still appear in practice modes, badged `unverified`. They never appear in exam
simulation.

---

## Writing lessons

A lesson is what a sector opens with. It is structured rather than free prose so the reader
can render it consistently, and so a key-numbers block is always in the same findable place
— which is what makes it usable as a reference later, not just a read.

Lessons live in `src/content/hvac/lessons/sector-N.ts`.

```ts
import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

const myLesson = defineLesson({
  id: 'hvac.lesson.6.airflow',
  track: 'hvac',
  domain: '6.0',          // must match a sector id
  order: 1,               // position within the sector
  title: 'Airflow: the half of the job that gets skipped',
  summary: 'One line on why this matters. Shown on the sector card.',
  minutes: 8,             // rough reading time
  sections: [ /* see below */ ],
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1'),
  status: 'verified',
}) satisfies Lesson;
```

Then export it from the file's array and it appears automatically — the "Learn" button, the
reading-time estimate and the lesson navigation all pick it up.

### The six section types

**`prose`** — ordinary explanation. Blank lines become paragraphs. `**bold**` and `*italic*`
render.

```ts
{ kind: 'prose', heading: 'Optional heading', body: 'Text…\n\nMore text…' }
```

**`keyNumbers`** — the things to memorise, in one findable block. Deliberately separate from
prose: these are what you will want on a roof at 4pm, and burying them in a paragraph makes
that impossible.

```ts
{
  kind: 'keyNumbers',
  heading: 'Commit these to memory',
  items: [
    { label: 'Design airflow', value: '400 CFM/ton', note: '350–450 acceptable' },
  ],
}
```

**`diagram`** — a topology, same model the questions use.

**`worked`** — a worked example, revealed one step at a time. The reader hides later steps
until asked, because being made to predict each step teaches far more than seeing the whole
solution at once.

```ts
{
  kind: 'worked',
  heading: 'Worked example: total external static',
  problem: 'A manometer reads −0.38 in the return and +0.42 in the supply…',
  steps: [
    { action: 'Ask why the return reads negative.', result: 'The blower is pulling on it.' },
    { action: 'Add the magnitudes, not the signed values.', result: '0.38 + 0.42 = 0.80' },
  ],
  answer: '0.80 in. w.c. — well past the 0.50 rating',
  moral: 'What the example was really teaching, beyond the arithmetic.',
}
```

**`table`** — comparison tables. Row length must match the column count; the validator checks.

**`callout`** — three tones:

- `tip` — a field shortcut
- `warning` — something that can hurt you or destroy equipment
- `trap` — a specific mistake people actually make

Use `trap` generously. Most of the value in a lesson is in naming the wrong turn before
somebody takes it.

### What makes a lesson worth reading

**Explain the mechanism, not just the rule.** "TESP adds the magnitudes" is a rule to
memorise and forget. "The return reads negative because the blower is pulling on it, and
both numbers represent work it is doing" is a reason you can reconstruct.

**Pull the numbers out.** If a fact is worth memorising, it belongs in a `keyNumbers` block
where it can be found again, not buried mid-paragraph.

**Name the trap.** Every topic has a specific way people get it wrong. Adding the signed
static values. Charging a TXV by superheat. Subtracting subcooling the wrong way. Say it
explicitly.

**Keep it to one sitting.** 6–9 minutes each. A sector with a lot to cover gets two lessons,
not one long one — there is a test asserting no sector exceeds 40 minutes total.

---

## Adding HVAC content

The HVAC track has ten sectors, one file each under `src/content/hvac/`. Open the file for
the sector, copy an existing entry, change it, add it to the export at the bottom. That is
the whole workflow.

Each sector has a main file and an `-extra` continuation, split purely so no single file
gets unwieldy. Both are merged in `index.ts`; add new questions to whichever is shorter.

```
src/content/hvac/
  sector-1-fundamentals.ts     1.0  Fundamentals & Safety
  sector-1-extra.ts            1.0  (continuation)
  sector-2-cycle.ts            2.0  The Refrigeration Cycle
  sector-3-refrigerants.ts     3.0  Refrigerants & EPA 608
  sector-4-charging.ts         4.0  Metering Devices & Charging
  sector-5-electrical.ts       5.0  Electrical Fundamentals
  sector-6-airflow.ts          6.0  Airflow & Duct Systems
  sector-7-psychrometrics.ts   7.0  Psychrometrics
  sector-8-heating.ts          8.0  Heating: Furnaces & Boilers
  sector-9-heatpumps.ts        9.0  Heat Pumps
  sector-10-diagnostics.ts    10.0  Diagnostics & Service
```

### Which HVAC sources are citable as `standard`

Better than you might expect, and worth preferring over a textbook wherever they apply:

- **40 CFR Part 82, Subpart F** — every EPA 608 rule. Free, authoritative, and what the
  exam is actually drawn from. Cite the section: `cite.standard('40 CFR §82.154')`.
- **ASHRAE Handbook — Fundamentals, Chapter 1** — psychrometric equations and the standard
  air constants behind 1.08, 0.68 and 4.5.
- **OSHA 29 CFR 1910** — lockout/tagout and the electrical safety requirements.
- **NFPA 70E** — safe electrical work practice, including live–dead–live verification.
- **ANSI/ASHRAE Standard 15** — refrigeration system safety.
- **The applicable fuel gas code** (NFPA 54 / IFGC) — venting categories, combustion air.
- **Manufacturer literature** for the specific equipment: sequence of operation, charging
  charts, nameplate charge and line-set adjustment. Cite as a book with the document
  revision in the `edition` field.
- **A derivation**, where the answer is arithmetic:
  `cite.standard('Derived: 2,000 lb × 144 BTU/lb ÷ 24 h')`.

Anything that is a study-guide framing rather than a specification — the three-tier
troubleshooting habit, condenser split ranges, "look at the filter first" — should carry
`cite.todo` and stay `draft` until you have a page to point at.

### Adding a whole new sector

1. Add the domain and the sector entry in `src/content/tracks.ts` under `HVAC`.
   The sector `id` must match a domain `id`, and `order` sets its place on the path.
2. Create `src/content/hvac/sector-N-name.ts` and export its questions.
3. Import it in `src/content/hvac/index.ts`.
4. `npm test` — there is a test asserting every sector has questions and every sector
   points at a real domain, so a half-wired sector fails immediately.

Domain `examWeight` values should still sum to 100 across the track; the validator warns
if they do not.

---

## Extending the Service Call simulator

The simulator lives in `src/games/hvac/`, and the two files that matter are:

**`system.ts`** — the fault definitions and their effects. To add a fault:

1. Add its id to `FaultId`.
2. Add a `FaultDef` to `FAULTS` with its complaints, signature, explanation, key
   measurements and the faults it is confused with.
3. Add a case to `effectFor()` describing how it shifts evaporator saturation, condensing
   temperature, superheat, subcooling, amps and the air-side temperature drop.
4. Add it to a tier in `TIERS` in `servicecall.ts`.
5. **Add a signature test** in `tests/hvac-system.test.ts`. This is not optional — the
   whole value of the simulator is that its signatures match reality, and a test is what
   keeps them there.

The effect numbers are severity-scaled, so `-15 * s` means "drops evaporator saturation by
up to 15°F at full severity". Sign conventions: positive raises the value.

**`refrigerant.ts`** — P-T tables. To correct one against your own chart, edit the `curve`
array. Entries are `[°F, psig]` ascending, interpolated linearly between rows. The tests
check monotonicity, round-tripping and the well-known anchor points, so a mistyped row
fails the build.

To add a refrigerant, add a `Refrigerant` entry with its curve and
`highPressureCutout` — the cutout is what stops the model running a failed-condenser-fan
scenario off the top of the saturation curve.

---

## Extending the generated drills

`src/games/hvac/drills.ts`. A generator is a function `(rng, id) => Question`. Add one, then
register it in the `GENERATORS` map under the lab it belongs to.

For numeric answers, use the schema-level tolerance rather than listing every acceptable
string:

```ts
accept: [String(computedValue)],
tolerance: 2,          // ±2 accepted, formatting-insensitive
```

Grading parses the response numerically, so `12000`, `12,000` and `12000 BTU/h` all match.
There is a test asserting every generated numeric drill accepts its own stated answer — if
a generator computes one number and explains a different one, the build fails.

Generated questions must still file under a real domain and objective. A test checks that
too.

---

## What the validator checks

Run by `npm test` and by the Content Audit screen.

**Errors** (block the build):

- Duplicate question ids — a later one would silently shadow an earlier one
- Answer index out of range for the choice list
- A domain or objective that does not exist in the track
- An objective filed under the wrong domain (`1.4` under domain `2.0`)
- Duplicate or empty choices
- `multi` where every choice is correct, or with no correct answers
- `match` with duplicate left-hand or right-hand items
- `order` with fewer than three steps, or duplicates
- A citation to an unregistered book id, or with no page reference
- `status: 'verified'` with no citation
- A topology link pointing at a node that does not exist
- `whyWrong` explaining the correct answer

**Warnings** (surfaced, not blocking):

- An explanation under 25 characters
- Domain exam weights not summing to 100%
- A book cited for a track revision it does not target
- An id that does not start with its track prefix
- An ISBN that is not 13 digits

What it **cannot** check is whether a fact is true. That is what the books are for.
