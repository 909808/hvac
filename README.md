# HVAC Trainer

An interactive course and simulator for learning HVAC — the physics, the refrigeration
cycle, refrigerants, charging, electrical, airflow, psychrometrics, heating, heat pumps and
diagnostics.

Ten sectors, each with **lessons that teach before they test**, a question bank, and a
checkpoint that gates the next sector. Plus simulators driven by a real physical model
rather than a lookup table of canned answers.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 182 tests: physics, fault signatures, content validation
```

**Content: 268 questions across six question types, 15 lessons, 6 generated drill families,
and a service call simulator with 9 modelled faults.**

---

## The idea

Most study apps are a pile of multiple-choice questions. That tests what you already know
and is a slow, demoralising way to meet an idea for the first time.

So every sector **opens with a lesson**: the concept explained, the numbers worth
memorising pulled into a findable block, a worked example revealed one step at a time so
you have to predict what comes next, and the traps called out explicitly. Then the
questions.

And the parts of HVAC that are genuinely hard are not facts — they are **judgements**:
whether 28°F of superheat means a leak or a restriction, whether a 16°F temperature drop is
a problem or just humid weather, which three readings settle a call and which five waste an
hour.

That is what the **system model** is for. A split system is simulated from its operating
conditions, a fault is injected, and every reading you can take is derived from the same
underlying state. Superheat computed from the gauges the sim hands you always agrees with
the superheat the fault should produce, because they come from the same place.

It also means the simulator's questions cannot be wrong the way a transcribed fact can.
There is no step where a number gets copied by hand.

---

## How a sector works

1. **Learn** — one or two lessons, 6–9 minutes each. Prose, key-number blocks, diagrams,
   comparison tables, worked examples with progressive reveal, and callouts for traps,
   warnings and field tips.
2. **Practise** — the sector's questions, spaced-repetition ordered, explanation after each
   answer.
3. **Checkpoint** — a graded test with explanations held to the end. Pass it and the next
   sector opens.

Six question types: single choice, select-all, typed input with numeric tolerance,
put-in-order, match-the-pairs, and **hotspot** — click the right component on a diagram,
which is a different skill from naming it.

---

## Design

Warm, low-contrast, and deliberately quiet. This is something you sit with for half an hour
at a time, and a screen that reads like paper under a lamp is easier to stay in than one
that reads like a dashboard.

Three rules the interface follows:

**One next thing.** The home screen opens with a single Continue card that knows where you
are — start the lesson, practise, or retake the checkpoint, depending on what you have
already done. Everything else is below it.

**The path is a list, not a grid.** Ten quiet rows, only the current one expanded. Locked
sectors stay visible and say what opens them, because hiding the road ahead makes a
curriculum feel arbitrary.

**Tooling lives in the footer.** Labs, progress and the content audit fold into a shelf at
the bottom. They are useful, and none of them is what you came to do.

Lessons set their prose in a serif and hold a narrow measure, because they are meant to be
read rather than scanned. Question screens show the objective and nothing else — no
difficulty badge to bias the answer, no draft badge that would appear on most of the bank,
and no score or streak until there is a number worth showing.

Dark by default, with a light theme that follows the system setting.

---

## Sectors

The path gates on itself — each sector opens when the one before it is passed. The order
is a dependency claim, not a ranking.

| # | Sector | What unlocks |
|---|---|---|
| 1 | Fundamentals & Safety | — |
| 2 | The Refrigeration Cycle | P-T Chart, Superheat & Subcooling |
| 3 | Refrigerants & EPA 608 | |
| 4 | Metering Devices & Charging | **Service Call** |
| 5 | Electrical Fundamentals | Electrical Bench |
| 6 | Airflow & Duct Systems | Airflow Bench |
| 7 | Psychrometrics | Psych Lab, Heat Formulas |
| 8 | Heating: Furnaces & Boilers | |
| 9 | Heat Pumps | |
| 10 | Diagnostics & Service | Service Call (all tiers) |

Deliberately out of scope: proprietary building-automation platforms and controls
integration. That is a specialism with its own tooling, and simulating it without the real
front end would teach the wrong habits.

---

## The Service Call simulator

The flagship. A customer complaint, a system with something wrong, and a van full of
instruments.

You pick what to measure. Each reading costs time against a 25-minute budget. Readings
appear on a live refrigeration circuit diagram at the point they were taken, and derived
values — superheat, subcooling, condenser split, evaporator temperature drop — appear
automatically once both of their inputs exist. Then you commit to a diagnosis.

**Scoring rewards evidence, not luck.** Guessing correctly without taking the readings that
prove it scores 40% and is graded "lucky guess", because on a real call that is exactly
what it was. The debrief shows the fault's signature, which key readings you skipped, and
contrasts it with the faults it is genuinely confused with.

Nine faults are modelled, each with the signature a technician is trained to recognise:

| Fault | Suction | Head | Superheat | Subcooling | Air ΔT |
|---|---|---|---|---|---|
| Undercharge | low | low | **high** | **low** | low |
| Restriction | low | low-normal | **high** | **high** | low |
| Overcharge | high | high | low | high | low |
| Dirty condenser | high | **high** | normal | normal-high | low |
| Condenser fan failed | high | **very high** | normal | high | low |
| Low evaporator airflow | low | low | low | normal-high | **high** |
| Compressor inefficient | **high** | **low** | high | low | low |
| Non-condensables | normal | high | normal | high | low |
| TXV overfeeding | high | normal | **near zero** | low | low |

The two rows worth memorising are the first two. Both starve the evaporator and both drive
superheat up — **subcooling is what separates them**, and getting it backwards is how a good
metering device gets replaced on a system that was simply low.

Each of those signatures is pinned by a test. If one flips, the build fails, because a
simulator that teaches a wrong diagnosis is worse than no simulator.

---

## Generated drills

Six labs, all computed rather than transcribed, so the supply is unlimited and there is no
citation risk:

- **P-T Chart** — pressure ↔ saturation temperature for R-22, R-410A, R-134a
- **Superheat & Subcooling** — calculate both, then read the pairings
- **Psych Lab** — dry bulb + wet bulb → RH, dew point, grains, enthalpy
- **Heat Formulas** — 1.08, 0.68, 4.5 and 500
- **Airflow Bench** — CFM/ton, total external static, friction rate, the three fan laws
- **Electrical Bench** — Ohm's law, power, series/parallel, capacitor tolerance

Psychrometrics is computed from the ASHRAE Fundamentals equations, not interpolated from a
chart image. Spot-checked against published chart values: 80°F DB / 67°F WB gives 51.1% RH
and 31.45 Btu/lb, which is what the chart says.

---

## The one thing to check

**The refrigerant P-T tables in `src/games/hvac/refrigerant.ts` are the highest-priority
item to verify against a real manufacturer P-T chart** — the one in your gauge case is the
authority, not this file. They are seeded from published saturation data and are good to
roughly ±2 psi across the comfort-cooling range.

Why that is safe in the meantime: the simulator generates every scenario from *saturation
temperature*, and converts to gauge pressure only for display. Superheat, subcooling,
condenser split and every fault signature are computed in °F. If a pressure is off by a psi
or two, the gauge face shifts slightly and the correct diagnosis does not change at all.

Tests pin the anchors every technician knows — R-22 at 40°F is 68.5 psig, R-410A at 40°F is
118.5 psig — plus monotonicity and pressure↔temperature round-tripping.

---

## Content integrity

Every authored fact carries a citation, enforced three ways:

1. **Compile time** — `defineQuestion` will not typecheck an item marked `status: 'verified'`
   whose source is `cite.todo(...)`.
2. **Test time** — a validator checks answer indices, objective codes, duplicate ids,
   ambiguous match tables, unregistered book citations. A bad paste fails CI.
3. **In the app** — uncited items are badged `unverified` while you play, listed on the
   Content Audit screen, and excluded from checkpoints.

Lessons go through the same validator: table rows must match their headers, diagram links
must point at nodes that exist, worked examples need an answer, and a lesson cannot be
marked verified without a citation.

Current state: **268 HVAC questions, 76 verified, 192 awaiting a citation**, plus 15
lessons. The verified ones are cited to things you can check in a minute — 40 CFR Part 82
for the EPA rules, ASHRAE Fundamentals for psychrometrics, OSHA 1910.147 for
lockout/tagout, NFPA 70E for electrical practice, or a stated derivation. The drafts are
study-guide framings, and no page numbers were invented for them.

Adding content is the main way to extend this. See **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)**.

---

## Books

Worth owning alongside this:

- **Refrigeration and Air Conditioning Technology**, Silberstein / Whitman / Johnson / Tomczyk
  (Cengage) — the standard trade-school text, and the one most programs teach from.
- **Modern Refrigeration and Air Conditioning**, Althouse / Turnquist / Bracciano
  (Goodheart-Willcox) — the other standard, heavier on diagrams.
- **Audel HVAC Fundamentals** (3 vols) — good field reference rather than a first read.
- **ASHRAE Handbook — Fundamentals** — the authority for psychrometrics and load
  calculation. Expensive; a library copy is fine for the chapters you need.
- **EPA 608 prep** — any current study guide, but verify against the actual 40 CFR Part 82
  text, which is free online and is what the exam is drawn from.

I have deliberately **not** registered these in `src/content/books.ts` with ISBNs, because
unlike the Network+ list I have not verified current editions for them. Add whichever you
buy, with the edition and ISBN in front of you — the guide explains how.

---

## Layout

```
src/
  engine/            Track-agnostic. No HVAC or networking knowledge here.
    types.ts         Content model, sectors, question kinds
    define.ts        defineQuestion + the compile-time citation rule
    validate.ts      Structural validation
    grade.ts         Answer checking, partial credit, numeric tolerance
    srs.ts           Spaced repetition
    session.ts       The question game loop
    lesson.ts        Lesson model and validation
    progression.ts   Sector gating and checkpoints
    profile.ts       Progress, mastery, persistence
  games/hvac/
    refrigerant.ts   P-T tables, superheat, subcooling, condenser split
    psychrometrics.ts ASHRAE equations — computed, not looked up
    airflow.ts       Static pressure, fan laws, delta-T judgement
    system.ts        The system model and its nine faults
    servicecall.ts   Scenario generation and scoring
    drills.ts        Six generated drill families
  games/             ipv4.ts, subnet.ts, portrush.ts — the Network+ generators
  content/
    tracks.ts        Sectors, domains, objectives
    hvac/            One question file per sector
    hvac/lessons/    One lesson file per sector
    network-plus/    Archived — kept, not maintained
  ui/                Browser front-end, no framework
tests/               182 tests
```

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm test` | Physics, fault signatures, content validation |
| `npm run check` | Typecheck and test together |

`dist/` is a static site. Progress lives in `localStorage`; there is no backend.

---

## Network+ (archived)

The CompTIA Network+ N10-009 track this repo started as is still here — 57 questions, the
subnetting and port generators, all its tests. It is marked `archived: true`, which tucks it
behind a "show archived" toggle on the track switcher so it does not compete with what you
are actually studying.

Shelved rather than deleted. Nothing is maintained there, and none of it is on the HVAC
path, but the content and any progress you made are intact.
