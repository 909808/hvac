import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/**
 * Sector 6 — Airflow & Duct Systems.
 *
 * The side of the job that gets skipped. A system can be perfectly charged and
 * still fail to cool a house because nobody measured static pressure.
 */

const T = { track: 'hvac', domain: '6.0' } as const;

const staticDiagram: Topology = {
  caption: 'Where a manometer goes to read total external static pressure',
  nodes: [
    { id: 'ret', kind: 'damper', label: 'Return', sublabel: 'filter rack', col: 0, row: 1 },
    { id: 'probe1', kind: 'sensor', label: 'Probe 1', sublabel: 'reads negative', col: 1, row: 1 },
    { id: 'ahu', kind: 'blower', label: 'Air handler', sublabel: 'rated 0.50 in.', col: 2, row: 1 },
    { id: 'probe2', kind: 'sensor', label: 'Probe 2', sublabel: 'reads positive', col: 3, row: 1 },
    { id: 'sup', kind: 'damper', label: 'Supply plenum', col: 4, row: 1 },
  ],
  links: [
    { from: 'ret', to: 'probe1' },
    { from: 'probe1', to: 'ahu' },
    { from: 'ahu', to: 'probe2' },
    { from: 'probe2', to: 'sup' },
  ],
};

// --- 6.1 CFM ------------------------------------------------------------------

const cfmPerTonRule = defineQuestion({
  ...T,
  id: 'hvac.6.1.cfm-per-ton',
  objective: '6.1',
  kind: 'choice',
  difficulty: 1,
  prompt: 'What is the design airflow for a cooling system, and what is the acceptable range?',
  choices: [
    '400 CFM per ton, with 350–450 acceptable',
    '400 CFM total, regardless of system size',
    '100 CFM per ton, with 80–120 acceptable',
    '1,000 CFM per ton, with 900–1,100 acceptable',
  ],
  answer: 0,
  explain:
    '400 CFM per ton is the design figure, and 350–450 is the working band.\n\n' +
    'Where you aim inside that band depends on climate. Below 400 the coil runs colder and pulls ' +
    'more moisture out — right for a humid climate, and right down at 350 for a system struggling ' +
    'with humidity. Above 400 gives more sensible capacity and less dehumidification, which suits ' +
    'a dry climate.\n\n' +
    'Outside the band things break. Too little air and the coil ices; too much and the coil never ' +
    'gets cold enough to condense, so the house hits setpoint and still feels clammy.',
  source: cite.todo('Confirm the airflow targets against your text.'),
  status: 'draft',
});

// --- 6.2 Static pressure --------------------------------------------------------

const tespMeasurement = defineQuestion({
  ...T,
  id: 'hvac.6.2.tesp-signs',
  objective: '6.2',
  kind: 'choice',
  difficulty: 3,
  topology: staticDiagram,
  prompt:
    'A manometer reads −0.38 in. w.c. in the return and +0.42 in. w.c. in the supply.\n\n' +
    'What is the total external static pressure?',
  choices: ['0.80 in. w.c.', '0.04 in. w.c.', '0.42 in. w.c.', '−0.80 in. w.c.'],
  answer: 0,
  whyWrong: {
    1: 'That is what you get by adding the signed values, which cancels most of the reading.',
    2: 'Supply alone is only half the story.',
    3: 'TESP is expressed as a positive magnitude.',
  },
  explain:
    'TESP is the sum of the ABSOLUTE values: 0.38 + 0.42 = 0.80 in. w.c.\n\n' +
    'The return reads negative because the blower is pulling on it and the supply positive because ' +
    'it is pushing. Both represent work the blower is doing, so both count. Adding the signed ' +
    'numbers would give 0.04 and make a severely restricted system look perfect.\n\n' +
    'Most residential air handlers are rated for 0.50 in. w.c. At 0.80 this blower is well past ' +
    'rating, and airflow will be substantially below design no matter how the equipment is ' +
    'charged. This is the measurement that catches undersized ductwork, and it is why a "the ' +
    'equipment is fine" call so often turns out not to be.',
  source: cite.standard('Arithmetic: |−0.38| + |+0.42|'),
  status: 'verified',
});

const highStaticCauses = defineQuestion({
  ...T,
  id: 'hvac.6.2.high-static-causes',
  objective: '6.2',
  kind: 'multi',
  difficulty: 2,
  prompt: 'Which of these raise total external static pressure? Select all that apply.',
  choices: [
    'A loaded or excessively restrictive filter',
    'Undersized return ductwork',
    'A dirty evaporator coil',
    'Closed or blocked supply registers',
    'Low refrigerant charge',
  ],
  answers: [0, 1, 2, 3],
  explain:
    'Everything the air has to squeeze past adds resistance, and the blower answers by developing ' +
    'more pressure and moving less air.\n\n' +
    'Return-side restriction is the most commonly underestimated. Installers routinely fit ' +
    'generous supply ductwork and a single undersized return, and no amount of equipment work ' +
    'fixes it.\n\n' +
    'Refrigerant charge has no bearing on static pressure — that is the air side, entirely ' +
    'separate. Which is exactly why measuring both matters: they fail independently and their ' +
    'symptoms overlap.',
  source: cite.todo('Confirm the causes of high static against your text.'),
  status: 'draft',
});

// --- 6.3 Fan laws ---------------------------------------------------------------

const fanLawSummary = defineQuestion({
  ...T,
  id: 'hvac.6.3.three-laws',
  objective: '6.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each fan law to how the quantity changes with blower speed.',
  pairs: [
    ['Airflow (CFM)', 'Varies directly with RPM'],
    ['Static pressure', 'Varies with the square of RPM'],
    ['Brake horsepower', 'Varies with the cube of RPM'],
  ],
  explain:
    'Direct, square, cube. The consequence is that a modest airflow gain costs a great deal of ' +
    'power: raise speed 25% and you get 25% more air, 56% more static pressure, and 95% more ' +
    'horsepower.\n\n' +
    'This is why speeding a blower up is a poor answer to an airflow complaint. The duct system ' +
    'is the restriction, the motor pays the price, and it eventually fails. Fix the duct.',
  source: cite.standard('Fan affinity laws'),
  status: 'verified',
});

// --- 6.4 Duct sizing --------------------------------------------------------------

const equivalentLength = defineQuestion({
  ...T,
  id: 'hvac.6.4.equivalent-length',
  objective: '6.4',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does "total equivalent length" account for in duct design?',
  choices: [
    'Straight duct plus the resistance of fittings, expressed as the length of straight duct that would cause the same pressure drop',
    'The physical length of the longest duct run only',
    'The sum of the lengths of every branch in the system',
    'The length of duct required to reach the furthest register',
  ],
  answer: 0,
  explain:
    'Fittings cause far more pressure drop than straight duct, so they are converted into the ' +
    'length of straight duct that would cost the same. A hard 90° elbow might be worth 30 or 40 ' +
    'feet; a boot or a takeoff similarly.\n\n' +
    'That is why a physically short run full of turns can behave like a very long one, and why ' +
    'duct design cannot be done with a tape measure alone.\n\n' +
    'Total equivalent length feeds the friction rate — available static × 100 ÷ TEL — which is the ' +
    'number the duct calculator actually needs.',
  source: cite.todo('Confirm against a duct design manual such as ACCA Manual D.'),
  status: 'draft',
});

// --- 6.5 Blowers -------------------------------------------------------------------

const blowerTypes = defineQuestion({
  ...T,
  id: 'hvac.6.5.ecm-vs-psc',
  objective: '6.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'How does a constant-airflow ECM blower respond to rising duct static pressure, compared with ' +
    'a PSC motor?',
  choices: [
    'The ECM speeds up to hold its airflow target, while a PSC simply moves less air',
    'Both move less air as static rises',
    'The ECM moves less air; a PSC holds airflow constant',
    'Neither is affected by static pressure',
  ],
  answer: 0,
  explain:
    'A PSC motor turns at a roughly fixed speed. Raise the resistance and it simply delivers less ' +
    'air — the fan curve does the work of telling you how much less.\n\n' +
    'A constant-airflow ECM measures torque and adjusts speed to hold the CFM it was commanded to ' +
    'deliver. That is better for comfort, but it hides duct problems: the airflow stays right ' +
    'while the motor works harder and harder, until it hits its limit or fails early.\n\n' +
    'Practical consequence: on an ECM system you cannot infer airflow from the temperature drop ' +
    'and assume the ducts are fine. Measure static pressure directly. A high reading with correct ' +
    'airflow still means the duct system is undersized and the motor is paying for it.',
  source: cite.todo('Confirm ECM behaviour against your text or the manufacturer literature.'),
  status: 'draft',
});

// --- 6.6 Filtration ------------------------------------------------------------------

const mervTradeoff = defineQuestion({
  ...T,
  id: 'hvac.6.6.merv-tradeoff',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A homeowner has fitted a high-MERV 1-inch filter to improve air quality. What is the likely ' +
    'consequence, and what is the better answer?',
  choices: [
    'Higher pressure drop and reduced airflow; use a larger filter area at the same MERV instead',
    'No effect — filter rating does not influence airflow',
    'Improved airflow, because denser media straightens the air',
    'The system will move more air but filter less effectively',
  ],
  answer: 0,
  explain:
    'Finer media captures more, and costs more pressure drop to push air through. In a 1-inch ' +
    'filter slot there is very little media area to spread that across, so a high-MERV 1-inch ' +
    'filter can add several tenths of an inch of static on its own.\n\n' +
    'The fix is area, not rating. A 4- or 5-inch media cabinet holds vastly more surface, so it ' +
    'achieves the same or better filtration at a fraction of the pressure drop, and it loads up ' +
    'far more slowly between changes.\n\n' +
    'Filtration and airflow are a genuine trade-off in a fixed slot, and pretending otherwise is ' +
    'how systems end up starved.',
  source: cite.todo('Confirm the filtration trade-off against your text.'),
  status: 'draft',
});

const filterFirst = defineQuestion({
  ...T,
  id: 'hvac.6.6.iced-coil-cause',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A call reports "no cooling" and you find the evaporator coil frozen into a solid block of ' +
    'ice.\n\nWhat should you do first?',
  choices: [
    'Shut off cooling, run the blower to thaw the coil, and look for the airflow or charge cause while it melts',
    'Connect gauges immediately and read the pressures',
    'Add refrigerant, since low charge causes freezing',
    'Chip the ice off to save time',
  ],
  answer: 0,
  whyWrong: {
    1: 'Gauge readings on an iced system reflect the ice, not the underlying fault.',
    2: 'Low charge is one possible cause, but so is low airflow, and adding refrigerant to the wrong one makes it worse.',
    3: 'Chipping punctures the coil.',
  },
  explain:
    'An iced coil has to be thawed before any reading means anything. The ice itself blocks ' +
    'airflow, which drives suction pressure down further, so the gauges are describing the ' +
    'symptom rather than the cause.\n\n' +
    'While it thaws, work out why. The two families of cause are low airflow — a loaded filter, ' +
    'dirty coil, failed blower, closed registers, undersized ducts — or low charge. The way to ' +
    'separate them once it is running: low charge shows high superheat and low subcooling; low ' +
    'airflow shows a high air-side temperature drop.\n\n' +
    'Not finding the cause guarantees a callback, because it will simply freeze again.',
  source: cite.todo('Confirm the frozen coil procedure against your service text.'),
  status: 'draft',
});

export const SECTOR_6_QUESTIONS: readonly Question[] = [
  cfmPerTonRule,
  tespMeasurement,
  highStaticCauses,
  fanLawSummary,
  equivalentLength,
  blowerTypes,
  mervTradeoff,
  filterFirst,
];
