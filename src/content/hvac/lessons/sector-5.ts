import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';
import type { Topology } from '@engine/types';

/** Sector 5 — Electrical Fundamentals. */

const ladderDiagram: Topology = {
  caption: 'A control circuit: every switch in the series string must close for the contactor to pull in',
  nodes: [
    { id: 'xfmr', kind: 'controller', label: 'Transformer', sublabel: '24 V', col: 0, row: 1 },
    { id: 'tstat', kind: 'thermostat', label: 'Thermostat', sublabel: 'Y call', col: 1, row: 1 },
    { id: 'hps', kind: 'sensor', label: 'High press.', sublabel: 'safety', col: 2, row: 1 },
    { id: 'lps', kind: 'sensor', label: 'Low press.', sublabel: 'safety', col: 3, row: 1 },
    { id: 'coil', kind: 'controller', label: 'Contactor', sublabel: 'coil', col: 4, row: 1 },
  ],
  links: [
    { from: 'xfmr', to: 'tstat' },
    { from: 'tstat', to: 'hps' },
    { from: 'hps', to: 'lps' },
    { from: 'lps', to: 'coil' },
  ],
};

const electricalBasics = defineLesson({
  id: 'hvac.lesson.5.basics',
  track: 'hvac',
  domain: '5.0',
  order: 1,
  title: "Ohm's law and reading a circuit",
  summary:
    'Most no-cool calls turn out to be electrical. The meter is faster than the gauges, and this ' +
    'is how you use it.',
  minutes: 7,
  sections: [
    {
      kind: 'keyNumbers',
      heading: 'The four relationships',
      items: [
        { label: 'Voltage', value: 'E = I × R', note: 'Volts' },
        { label: 'Current', value: 'I = E ÷ R', note: 'Amps' },
        { label: 'Resistance', value: 'R = E ÷ I', note: 'Ohms' },
        { label: 'Power', value: 'P = E × I', note: 'Watts, for a resistive load' },
        { label: 'Series resistance', value: 'R₁ + R₂ + R₃', note: 'They add' },
        { label: 'Two in parallel', value: '(R₁ × R₂) ÷ (R₁ + R₂)', note: 'Always less than the smaller one' },
      ],
    },
    {
      kind: 'prose',
      heading: 'Series and parallel, and why equipment is wired the way it is',
      body:
        '**Safety controls go in series** with the load. A series string is an AND: high-pressure ' +
        'switch AND low-pressure switch AND float switch all have to be closed. Any one opening ' +
        'stops the load, which is exactly what a safety chain is for.\n\n' +
        '**Loads go in parallel**, so each sees full supply voltage and operates independently. The ' +
        'blower does not care whether the compressor is running.\n\n' +
        'This is not trivia — it is what makes voltage-drop troubleshooting work.',
    },
    {
      kind: 'diagram',
      topology: ladderDiagram,
    },
    {
      kind: 'worked',
      heading: 'Worked example: finding the open switch',
      problem:
        'A 24 V control circuit has four safety switches in series with a contactor coil. The ' +
        'contactor will not pull in.\n\n' +
        'You measure across each switch in turn and get: 0 V, 0 V, 24 V, 0 V.\n\n' +
        'What have you found?',
      steps: [
        {
          action: 'Recall what voltage across a CLOSED switch should be. A closed switch has almost no resistance.',
          result: 'Almost 0 V — voltage divides by resistance, and there is nearly none.',
        },
        {
          action: 'Recall what voltage across an OPEN switch should be. An open switch is effectively infinite resistance.',
          result: 'The FULL supply voltage appears across it.',
        },
        {
          action: 'Apply that to the readings.',
          result: 'Switches 1, 2 and 4 are closed. Switch 3 has all 24 V across it.',
        },
      ],
      answer: 'Switch 3 is open, and it is the one interrupting the circuit.',
      moral:
        'This test is done live, in place, with nothing disconnected — which is why it beats ' +
        'resistance testing in the field. The next question is *why* it is open: a genuine fault it ' +
        'is protecting against, or a failed switch. Jumping it out to "test" is how equipment gets ' +
        'destroyed and people get hurt.',
    },
    {
      kind: 'prose',
      heading: 'The low-voltage control idea',
      body:
        'A thermostat never switches 240 V. It switches 24 V to a **contactor coil**, and the ' +
        'contactor does the real work of connecting the high-voltage load.\n\n' +
        'A small, safe signal controls a large, dangerous one. Everything in the control circuit ' +
        'follows this pattern.\n\n' +
        'That is why control-circuit troubleshooting usually starts at the transformer. No 24 V on ' +
        'the secondary means nothing downstream can operate, and it is a two-second check.',
    },
    {
      kind: 'table',
      heading: 'Thermostat terminals',
      columns: ['Terminal', 'What it does'],
      rows: [
        ['R', '24 V hot from the transformer'],
        ['C', 'Common — the return side of the 24 V circuit'],
        ['Y', 'Cooling call → compressor contactor'],
        ['G', 'Indoor blower'],
        ['W', 'Heat call'],
        ['O/B', 'Reversing valve on a heat pump (O = energised in cooling, B = in heating)'],
      ],
      note:
        'These are conventions, not a standard. Always check the diagram on the equipment. C is ' +
        'the one causing most modern trouble — Wi-Fi thermostats need it for continuous power, and ' +
        '"the new thermostat keeps dropping offline" is very often a missing common wire.',
    },
  ],
  source: cite.standard("Ohm's law; series and parallel circuit behaviour"),
  status: 'verified',
}) satisfies Lesson;

const motorsAndCapacitors = defineLesson({
  id: 'hvac.lesson.5.motors',
  track: 'hvac',
  domain: '5.0',
  order: 2,
  title: 'Motors, capacitors and what fails',
  summary: 'Winding tests, capacitor tolerance, and reading a locked-rotor condition.',
  minutes: 6,
  sections: [
    {
      kind: 'prose',
      heading: 'Testing a single-phase compressor',
      body:
        'Three terminals: Common, Start and Run. The two windings share the common terminal, so ' +
        'measuring Run to Start puts them in series.\n\n' +
        'The relationship is always: **R–S = (C–R) + (C–S)**. The largest reading equals the sum of ' +
        'the other two.\n\n' +
        'That also identifies unmarked terminals. The highest reading is between run and start, so ' +
        'the terminal *not* involved in it is common. Of the remaining two, the one with higher ' +
        'resistance to common is start — more turns of finer wire — and the lower is run.\n\n' +
        'If the numbers do not add up, a winding is damaged. Also check each terminal to the shell: ' +
        'any continuity to ground means the compressor is grounded and must be replaced.',
    },
    {
      kind: 'keyNumbers',
      heading: 'Capacitor facts',
      items: [
        { label: 'Run capacitor tolerance', value: '±6%', note: 'Outside this, replace it' },
        { label: 'Dual capacitor terminals', value: 'C, HERM, FAN', note: 'Test each half separately' },
        { label: 'Start capacitor duty', value: 'Seconds only', note: 'Switched out after start' },
        { label: 'Discharge tool', value: '20 kΩ, 2 W resistor', note: 'Never a screwdriver' },
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'Weak capacitors do not fail cleanly',
      body:
        'A capacitor that has drifted out of tolerance still lets the motor *try* to start. It ' +
        'draws locked-rotor current, heats up, and trips its overload. The symptom is intermittent ' +
        'hard-starting, not a dead unit.\n\n' +
        'So "it works sometimes" points at a capacitor far more often than at a failing motor. ' +
        'Measure it — a capacitance meter reading against the rating settles it in seconds, and a ' +
        'capacitor is a fraction of the cost of a compressor.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: hums and trips',
      problem:
        'A compressor hums for a few seconds, draws very high current, then trips its overload. ' +
        'Line voltage at the contactor is correct.\n\nWhat is going on, and what do you check?',
      steps: [
        {
          action: 'Interpret "hums with very high current". The motor is energised but not turning.',
          result: 'Locked rotor.',
        },
        {
          action: 'With good voltage at the terminals, list what could prevent rotation.',
          result: 'Either it cannot produce starting torque, or it physically cannot turn.',
        },
        {
          action: 'Rank those by likelihood and cost to test.',
          result: 'Run capacitor first — cheap, quick, and far more common than a seized compressor.',
        },
        {
          action: 'If the capacitor is good, try a hard-start kit as a diagnostic.',
          result: 'Starts with one → weak but alive. Still will not turn → seized.',
        },
      ],
      answer: 'Test the run capacitor first, then the compressor windings and a hard-start kit.',
      moral:
        'Note what this rules OUT. Neither refrigerant charge nor airflow can cause a locked rotor. ' +
        'Both affect how well a *running* compressor performs, not whether it can start.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Discharge before you touch',
      body:
        'A capacitor stores energy independently of the supply. Opening the disconnect does not ' +
        'empty it, and a large run capacitor holds enough to injure you.\n\n' +
        'Discharge deliberately through a resistor. Shorting with a screwdriver does dump the ' +
        'charge, but as an arc — that is how people end up with burns and pitted tools. On a dual ' +
        'capacitor, discharge HERM-to-C and FAN-to-C separately.',
    },
  ],
  source: cite.todo('Confirm the winding test and capacitor tolerances against your text.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_5_LESSONS: readonly Lesson[] = [electricalBasics, motorsAndCapacitors];
