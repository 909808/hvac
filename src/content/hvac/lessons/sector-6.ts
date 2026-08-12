import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';
import type { Topology } from '@engine/types';

/** Sector 6 — Airflow & Duct Systems. */

const staticDiagram: Topology = {
  caption: 'Total external static: both probes, both magnitudes added',
  nodes: [
    { id: 'ret', kind: 'damper', label: 'Return', sublabel: 'filter rack', col: 0, row: 1 },
    { id: 'p1', kind: 'sensor', label: 'Probe 1', sublabel: 'reads −', col: 1, row: 1 },
    { id: 'ahu', kind: 'blower', label: 'Air handler', sublabel: 'rated 0.50', col: 2, row: 1 },
    { id: 'p2', kind: 'sensor', label: 'Probe 2', sublabel: 'reads +', col: 3, row: 1 },
    { id: 'sup', kind: 'damper', label: 'Supply', col: 4, row: 1 },
  ],
  links: [
    { from: 'ret', to: 'p1' },
    { from: 'p1', to: 'ahu' },
    { from: 'ahu', to: 'p2' },
    { from: 'p2', to: 'sup' },
  ],
};

const airflow = defineLesson({
  id: 'hvac.lesson.6.airflow',
  track: 'hvac',
  domain: '6.0',
  order: 1,
  title: 'Airflow: the half of the job that gets skipped',
  summary:
    'A perfectly charged system can still fail to cool a house. Static pressure is how you find ' +
    'out why.',
  minutes: 8,
  sections: [
    {
      kind: 'prose',
      body:
        'Refrigerant gets all the attention, and airflow causes more callbacks. A system starved of ' +
        'air looks, on the gauges, a lot like several other faults — so the air-side numbers are ' +
        'what separate them.\n\n' +
        'The design target is **400 CFM per ton**, with 350–450 as the working band.\n\n' +
        'Where you aim inside that band depends on climate. Below 400 the coil runs colder and ' +
        'pulls more moisture out, which suits a humid climate. Above 400 gives more sensible ' +
        'capacity and less dehumidification, which suits a dry one.\n\n' +
        'Outside the band things break. Too little air and the coil ices. Too much and the coil ' +
        'never gets cold enough to condense, so the house hits setpoint and still feels clammy.',
    },
    {
      kind: 'keyNumbers',
      heading: 'The numbers',
      items: [
        { label: 'Design airflow', value: '400 CFM/ton', note: '350–450 acceptable' },
        { label: 'Typical AHU rating', value: '0.50 in. w.c.', note: 'Total external static' },
        { label: 'CFM from velocity', value: 'CFM = fpm × ft²', note: '' },
        { label: 'Friction rate', value: 'FR = (static × 100) ÷ TEL', note: 'For the duct calculator' },
        { label: 'CFM from capacity', value: 'CFM = Qs ÷ (1.08 × ΔT)', note: 'Sensible equation rearranged' },
      ],
    },
    {
      kind: 'diagram',
      topology: staticDiagram,
    },
    {
      kind: 'worked',
      heading: 'Worked example: total external static',
      problem:
        'A manometer reads −0.38 in. w.c. in the return plenum and +0.42 in. w.c. in the supply.\n\n' +
        'The air handler is rated for 0.50 in. w.c. What is the TESP, and what does it tell you?',
      steps: [
        {
          action: 'Ask why the return reads negative.',
          result: 'The blower is pulling on it. The supply is positive because it is being pushed.',
        },
        {
          action: 'Decide whether to add the signed values or their magnitudes. Both represent work the blower is doing.',
          result: 'Magnitudes. Adding signed values would cancel most of the reading.',
        },
        {
          action: 'Add them.',
          result: '0.38 + 0.42 = 0.80 in. w.c.',
        },
        {
          action: 'Compare against the rating.',
          result: '0.80 is 60% above the 0.50 rating.',
        },
      ],
      answer:
        '0.80 in. w.c. — well past rating. Airflow will be substantially below design no matter how ' +
        'the equipment is charged.',
      moral:
        'Adding the signed numbers gives 0.04 and makes a severely restricted system look perfect. ' +
        'This is the mistake to never make. TESP is the measurement that catches undersized ' +
        'ductwork, which is why a "the equipment is fine" call so often turns out not to be.',
    },
    {
      kind: 'table',
      heading: 'The three fan laws',
      columns: ['Quantity', 'Varies with', 'Speed +25% gives'],
      rows: [
        ['Airflow (CFM)', 'RPM — directly', '+25%'],
        ['Static pressure', 'RPM² — the square', '+56%'],
        ['Brake horsepower', 'RPM³ — the cube', '+95%'],
      ],
      note:
        'Doubling airflow costs eight times the power. This is why speeding a blower up is a poor ' +
        'answer to an airflow complaint — the duct is the restriction, and the motor pays for it.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'ECM blowers hide duct problems',
      body:
        'A PSC motor turns at roughly fixed speed: raise the resistance and it simply moves less ' +
        'air, which shows up in the temperature drop.\n\n' +
        'A constant-airflow ECM measures torque and speeds up to hold its CFM target. Airflow stays ' +
        'right while the motor works harder and harder until it hits its limit or fails early.\n\n' +
        'So on an ECM system you **cannot** infer duct health from the temperature drop. Measure ' +
        'static pressure directly. A high reading with correct airflow still means the ducts are ' +
        'undersized and the motor is paying.',
    },
    {
      kind: 'prose',
      heading: 'Equivalent length, and why short runs can behave like long ones',
      body:
        'Fittings cause far more pressure drop than straight duct, so duct design converts them ' +
        'into the length of straight duct that would cost the same. A hard 90° elbow might be worth ' +
        '30 or 40 feet.\n\n' +
        'That is why a physically short run full of turns behaves like a very long one, and why ' +
        'duct design cannot be done with a tape measure alone.\n\n' +
        'Total equivalent length feeds the friction rate, which is the number the duct calculator ' +
        'actually needs.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'Filters: the answer is area, not rating',
      body:
        'Finer media captures more and costs more pressure drop. In a 1-inch slot there is very ' +
        'little media area to spread that across, so a high-MERV 1-inch filter can add several ' +
        'tenths of static on its own.\n\n' +
        'A 4- or 5-inch media cabinet holds vastly more surface, achieving the same filtration at a ' +
        'fraction of the pressure drop — and loading far more slowly between changes.',
    },
  ],
  source: cite.todo('Confirm the airflow targets and duct design guidance against your text or ACCA Manual D.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_6_LESSONS: readonly Lesson[] = [airflow];
