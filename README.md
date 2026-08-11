# Network+ Trainer

An interactive browser game for studying **CompTIA Network+ (N10-009)**, built so that
the content it teaches you can be traced back to a source you trust.

The engine is track-agnostic. Network+ is the first body of knowledge loaded into it;
an HVAC controls track is already wired up and waiting for content.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # validates all content + engine tests
```

---

## Why it is built this way

The hard part of a study game is not the game — it is that a wrong fact, drilled with
spaced repetition, is worse than no study at all. You will remember it, confidently, and
be wrong in the exam.

So the content layer is built around one rule: **nothing claims to be verified without a
citation.** That rule is enforced three ways.

1. **At compile time.** `defineQuestion` will not typecheck an item marked
   `status: 'verified'` whose source is `cite.todo(...)`. You cannot mark something
   verified without pointing at a book, an RFC, or a generator.
2. **At test time.** `npm test` runs a validator over every question: answer indices in
   range, objectives that actually exist, no duplicate ids, no ambiguous match tables, no
   citation to an unregistered book. A bad paste fails CI rather than reaching a study
   session.
3. **In the app.** Uncited items are badged `unverified` while you play, listed on the
   Content Audit screen, and excluded from exam simulation entirely.

Roughly two thirds of the starter content is cited to a primary standard — an RFC, an IEEE
spec, a TIA cabling standard. Those are the most reliable items in the app, more so than
any study guide, because you can check them against the source in a minute. The rest is
marked `draft` and is waiting for you and a book.

---

## Which books to buy

**Buy one conceptual guide and one book of practice questions.** Two conceptual guides
covering the same objectives is mostly wasted money; a guide with no practice bank leaves
you unable to tell whether you actually know it.

### Pick one as your main text

| | |
|---|---|
| **CompTIA Network+ Certification All-in-One Exam Guide, Ninth Edition** | Jonathan S. Weissman & Mike Meyers · Total Seminars · ISBN **9780981621739** |
| **CompTIA Network+ Study Guide: Exam N10-009**, 6th ed. | Todd Lammle & Jon Buhagiar · Sybex · ISBN **9781394235605** |

They are both complete and both current. The difference is voice. Meyers/Weissman is
conversational and explains *why* things work, with a lot of real-world context — better if
networking is new to you. Lammle/Buhagiar is denser and more systematic, closer to a
reference — better if you already work with this stuff and want the objectives covered
crisply. Read a sample chapter of each and buy the one you would actually keep reading.

### Then buy the practice bank

| | |
|---|---|
| **CompTIA Network+ Practice Tests: Exam N10-009**, 3rd ed. | Craig Zacker · Sybex · ISBN **9781394239290** |

Around 1,000 questions organised by domain. This is the book to transcribe *reasoning*
from — not the questions themselves, but the explanations of why each distractor is wrong,
which is the part this app's `whyWrong` field exists to hold.

### Optional, only if you want it

| | |
|---|---|
| **CompTIA Network+ N10-009 Cert Guide**, 2nd ed. | Anthony Sequeira · Pearson IT Certification · ISBN **9780135367889** |
| **CompTIA Network+ N10-009 Exam Cram** | Emmett Dulaney · Pearson IT Certification · ISBN **9780135340837** |

The Cert Guide is a good third opinion when a topic will not click. The Exam Cram is a
last-week condensation — useful for final review, useless as a first read.

### Two free things worth more than a fourth book

- **The official exam objectives PDF**, from CompTIA's certification site. Free, and it is
  the only authoritative statement of what is on the exam. Everything else, including this
  repo, is somebody's interpretation of it. Download it and check
  [`src/content/tracks.ts`](src/content/tracks.ts) against it — that file was written from
  published summaries, not from the PDF itself, so the objective titles deserve one
  pass of your eyes.
- **Professor Messer's N10-009 video course.** Free on his site and YouTube. Pairs well
  with either main text.

> Editions and ISBNs above were checked against publisher and retailer listings in
> August 2026. Page numbers move between printings, so record the edition you own in
> [`src/content/books.ts`](src/content/books.ts) — it is already filled in for all five.

**One caution:** N10-009 launched in June 2024 and is expected to retire around late 2027.
Anything written for **N10-008** is a version behind. Check the exam code on the cover
before you buy, especially second-hand.

---

## Adding content

See **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)** for the full walkthrough. The short version:

```ts
defineQuestion({
  id: 'n10-009.2.2.stp-root-election',
  track: 'n10-009',
  domain: '2.0',
  objective: '2.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which switch becomes the root bridge?',
  choices: ['Lowest bridge ID', 'Highest MAC address', '…'],
  answer: 0,
  explain: 'Say why, not just what — this is the part you will actually read at 11pm.',
  source: cite.book('meyers-9e', '312-314'),
  status: 'verified',
});
```

Then `npm test`. If you got something structurally wrong, it tells you exactly what and where.

---

## Game modes

| Mode | What it does |
|---|---|
| **Drill** | Spaced-repetition practice from the authored bank, explanation after each answer. Where most of your time should go. |
| **Weak Spots** | Only the questions with the lowest mastery. Unlocks after a few sessions of history. |
| **Subnet Lab** | Procedurally generated IPv4 practice — network/broadcast addresses, host ranges, VLSM, classification. Infinite supply, correct by construction. |
| **Port Rush** | Two-minute timer, three lives, rapid-fire ports and protocols. |
| **Exam Simulation** | 90 questions in 90 minutes, domains sampled at the published weightings, explanations held to the end. Verified content only. |

Five question types are supported: single choice, select-all-that-apply, typed input,
put-in-order, and match-the-pairs. Scenario questions can carry an SVG topology diagram.

Number keys pick an option, `Enter` continues, `S` skips.

---

## How it is laid out

```
src/
  engine/          Track-agnostic. No Network+ knowledge lives here.
    types.ts       The content model
    define.ts      defineQuestion + the compile-time citation rule
    validate.ts    Structural validation
    grade.ts       Answer checking, including partial credit
    srs.ts         Spaced repetition (SM-2 adapted for partial credit)
    session.ts     The game loop
    select.ts      Exam paper construction, weighted by domain
    profile.ts     Progress, mastery, persistence
  content/         The facts. This is the part you will edit.
    books.ts       Registered sources
    tracks.ts      Domains and objectives
    network-plus/  One file per domain
    hvac/          Empty, ready for you
  games/           Procedural generators
    ipv4.ts        Subnet arithmetic (heavily unit-tested)
    subnet.ts      Generated subnetting questions
    portrush.ts    Generated port questions
  ui/              Browser front-end, no framework
tests/             86 tests over the engine, the maths and all content
```

The engine knows nothing about networking, which is what makes the HVAC track a matter of
adding files rather than changing code.

---

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm test` | Content validation + engine tests |
| `npm run check` | Typecheck and test together |

`dist/` is a static site — it will host anywhere, and all progress is kept in
`localStorage`, so there is no backend to run.
