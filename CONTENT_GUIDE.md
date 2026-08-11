# Adding content

Everything in this guide assumes you have a book open next to you. That is the point —
the app is built so that transcribing from a real source is the easy path and inventing
things is the awkward one.

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

Prefer `cite.standard` when the fact has a primary source. "DHCPDISCOVER is a broadcast"
is in RFC 2131; you do not need a textbook to tell you that, and the RFC will still be
correct in ten years. Use `cite.book` for anything that is a study-guide framing rather
than a specification — the three-tier hierarchical model, the hot/cold aisle layout, how
CompTIA groups attack types.

---

## Your first question

Content lives in `src/content/network-plus/domain-N-*.ts`. Open the file for the domain,
copy an existing entry, and change it.

```ts
import { cite, defineQuestion } from '@engine/define';

const stpRoot = defineQuestion({
  // Convention: <track>.<objective>.<slug>. Must be unique across the whole app.
  id: 'n10-009.2.2.stp-root-election',
  track: 'n10-009',
  domain: '2.0',
  objective: '2.2',

  kind: 'choice',
  difficulty: 2,              // 1 recall · 2 applied · 3 analysis

  prompt: 'Four switches run STP with default priorities. Which becomes root bridge?',
  choices: [
    'The one with the lowest MAC address',
    'The one with the highest MAC address',
    'The one with the most ports',
    'The one powered on first',
  ],
  answer: 0,

  // Optional: why each distractor is wrong. Shown under that choice on reveal.
  // This is the single highest-value field in the whole schema — see below.
  whyWrong: {
    1: 'Lowest wins, not highest — the comparison is a straight numeric one.',
    3: 'Boot order affects which switch claims root first, but the election re-converges.',
  },

  explain:
    'Bridge ID is priority followed by MAC address. With priorities equal at the ' +
    'default 32768, the MAC address breaks the tie and the lowest wins. This is why ' +
    'the oldest switch in the room so often ends up as root by accident — set the ' +
    'priority explicitly on the switch you actually want.',

  source: cite.standard('IEEE 802.1D'),
  status: 'verified',
});
```

Then add it to the export at the bottom of the file:

```ts
export const DOMAIN_2_QUESTIONS: readonly Question[] = [
  routingProtocolTypes,
  // …
  stpRoot,          // ← here
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
from real confusions — network address vs. broadcast address, forward proxy vs. reverse
proxy, RPO vs. RTO, APIPA vs. CGNAT.

**Fill in `whyWrong` when you can.** This is where a practice-test book earns its price.
Zacker's explanations of *why each distractor fails* are exactly this field. Transcribing
those is more valuable than transcribing another hundred prompts.

**Say why, not just what.** "The answer is 100 metres" teaches a number. "The 100 m channel
is 90 m in the walls plus 10 m of patch cords, which is what people forget when they say
'the run is only 92 m'" teaches you to catch the mistake in the field.

---

## The five question types

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

Node kinds: `router` `switch` `firewall` `server` `pc` `ap` `cloud` `controller` `sensor`.
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

## Adding the HVAC controls track

The track is already registered and appears in the app; it just has no questions. To fill it:

**1. Decide what the domains are.** Unlike N10-009, no external body dictates this. The
outline in `src/content/tracks.ts` under `HVAC_CONTROLS` is a sketch — reshape it before
there is content filed against it, because moving objectives later means editing every
question that references them.

**2. Register your references** in `src/content/books.ts`. For controls work the citable
sources are better than you might expect:

- **ANSI/ASHRAE Standard 135** for anything BACnet — object types, services, MS/TP framing.
  This is a primary source; cite it with `cite.standard`, not `cite.book`.
- **The Modbus Application Protocol Specification** (modbus.org) for function codes and
  register addressing. Also primary, also free.
- **TIA-485-A** for RS-485 electrical characteristics — segment length, node count,
  termination, biasing.
- **The ASHRAE Handbook**, HVAC Applications volume, for building automation practice.
- **Manufacturer sequence-of-operation documents** for the plant you actually work on.
  Cite these as books with the document revision in the `edition` field.

**3. Write questions into `src/content/hvac/`** and export them from `HVAC_QUESTIONS`.
Everything else — scheduling, scoring, mastery tracking, the audit screen — already works.

The protocol and electrical facts are the ones that reach `verified` quickly, the same way
the IANA port table did for Network+. Sequence-of-operation and troubleshooting content will
mostly start as `draft` until you have a document to point at.

There is real overlap worth exploiting: RS-485 topology and termination is the same class of
problem as Ethernet cabling; BACnet/IP over a building network raises the same VLAN,
broadcast-domain and segmentation questions as domain 4.3. Cross-reference rather than
duplicating.

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
