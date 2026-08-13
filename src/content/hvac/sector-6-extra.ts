import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 6 — additional questions. Continuation of `sector-6-airflow.ts`. */

const T = { track: 'hvac', domain: '6.0' } as const;

const cfmFromCapacity = defineQuestion({
  ...T,
  id: 'hvac.6.1.cfm-from-sensible',
  objective: '6.1',
  kind: 'input',
  difficulty: 3,
  prompt:
    'A coil is removing 24,000 BTU/h of sensible heat with a 20°F temperature drop.\n\n' +
    'How much air is moving, in CFM?',
  placeholder: 'CFM',
  accept: ['1111'],
  tolerance: 40,
  explain:
    'Rearrange the sensible heat equation: CFM = Qs ÷ (1.08 × ΔT) = 24,000 ÷ (1.08 × 20) = ' +
    '24,000 ÷ 21.6 = **about 1,111 CFM**.\n\n' +
    'This is how you measure airflow without a flow hood: measure the temperature drop, know the ' +
    'sensible capacity, and solve for CFM.\n\n' +
    'It is only as good as your capacity figure, which is why it is a cross-check rather than a ' +
    'primary measurement. But it costs two thermometers and it catches gross airflow problems.',
  source: cite.standard('CFM = Qs ÷ (1.08 × ΔT)'),
  status: 'verified',
});

const returnGrilleVelocity = defineQuestion({
  ...T,
  id: 'hvac.6.1.grille-noise',
  objective: '6.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A return grille whistles audibly. What does that indicate?',
  choices: [
    'Air velocity through it is too high — the grille is undersized for the airflow',
    'The blower is running too slowly',
    'The filter has been fitted backwards',
    'The duct is oversized',
  ],
  answer: 0,
  explain:
    'Noise is a velocity symptom. Push too much air through too small an opening and it becomes ' +
    'turbulent and audible.\n\n' +
    'Return grilles are undersized far more often than supply registers, because installers size ' +
    'the supply side carefully and treat the return as an afterthought. The result is high static ' +
    'pressure, reduced airflow and a system the customer can hear.\n\n' +
    'The fix is more return area — a larger grille, or an additional return — not a slower blower.',
  source: cite.todo('Confirm face velocity guidance against your text or ACCA Manual D.'),
  status: 'draft',
});

const staticPressureProbe = defineQuestion({
  ...T,
  id: 'hvac.6.2.probe-placement',
  objective: '6.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Where should the two static pressure probes go to measure total external static correctly?',
  choices: [
    'Between the filter and the blower, and after the blower but before the coil — measuring what the blower works against externally',
    'At the furthest supply register and the return grille',
    'Both in the supply plenum, six inches apart',
    'Anywhere in the ductwork, as long as they are on opposite sides',
  ],
  answer: 0,
  whyWrong: {
    1: 'That measures the duct system but excludes the air handler internals the rating refers to.',
    2: 'Two probes on the same side measure a pressure drop within the supply, not TESP.',
    3: 'Placement determines what you are measuring; it is not arbitrary.',
  },
  explain:
    'TESP is what the blower develops against everything **external** to itself. So the probes go ' +
    'immediately either side of the blower section.\n\n' +
    'Where exactly depends on the equipment: whether the coil and filter are inside the cabinet or ' +
    'outside it changes whether their drop is included. The rating on the data plate tells you what ' +
    'it assumes.\n\n' +
    'Measuring across additional components and comparing against a rating that excludes them makes ' +
    'a healthy system look badly restricted.',
  source: cite.todo('Confirm probe placement against your text and manufacturer literature.'),
  status: 'draft',
});

const componentPressureDrop = defineQuestion({
  ...T,
  id: 'hvac.6.2.finding-the-restriction',
  objective: '6.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'TESP measures 0.90 in. w.c. against a 0.50 rating. How do you find where the restriction is?',
  choices: [
    'Measure the pressure drop across each component in turn and compare with its published drop',
    'Replace the blower motor with a larger one',
    'Open all the supply registers and re-measure',
    'Increase the blower speed and see if it improves',
  ],
  answer: 0,
  explain:
    'Total static tells you there is a problem. Component-by-component drops tell you where.\n\n' +
    'Measure across the filter, across the coil, across each duct section. Compare each against ' +
    'the manufacturer\'s published drop for that component at that airflow. Whatever is well above ' +
    'its published figure is your restriction.\n\n' +
    'A filter is often 0.10–0.25 in. w.c. when clean; a wet coil more. Finding one component at ' +
    '0.45 when it should be 0.15 is a definite answer, where "high static" alone is not.',
  source: cite.todo('Confirm the component drop method against your text.'),
  status: 'draft',
});

const fanCurve = defineQuestion({
  ...T,
  id: 'hvac.6.3.reading-a-fan-table',
  objective: '6.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A blower table lists CFM against external static at each speed tap.\n\nHow do you use it?',
  choices: [
    'Measure TESP, find your speed tap row, and read across to the airflow it is actually delivering',
    'Pick the airflow you want and set the tap to match',
    'Use the highest speed tap listed for the equipment',
    'It only applies at 0.50 in. w.c.',
  ],
  answer: 0,
  explain:
    'The table is a lookup with two inputs: which tap the blower is wired to, and what static it is ' +
    'working against. That gives you the airflow it is genuinely producing — not what you hoped for.\n\n' +
    'It is the honest airflow check on a PSC blower, and it takes one manometer reading.\n\n' +
    'Note how quickly the numbers fall off as static rises. A blower delivering 1,200 CFM at 0.30 ' +
    'might be down to 900 at 0.80, which is the difference between a working system and an icing ' +
    'coil.',
  source: cite.todo('Confirm blower table use against manufacturer literature.'),
  status: 'draft',
});

const flexDuctCompression = defineQuestion({
  ...T,
  id: 'hvac.6.4.compressed-flex',
  objective: '6.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Flexible duct is installed with noticeable slack, sagging between supports.\n\nWhat is the effect?',
  choices: [
    'A large increase in friction — compressed and sagging flex has far more resistance than the same duct pulled taut',
    'None, provided the length is correct',
    'It improves airflow by slowing the air',
    'It only affects noise',
  ],
  answer: 0,
  explain:
    'Flex duct is rated pulled tight. Let it sag and the inner liner corrugates, which multiplies ' +
    'friction — published figures suggest a compressed run can have several times the resistance of ' +
    'the same duct stretched properly.\n\n' +
    'Sagging between distant supports does the same thing over and over along the run.\n\n' +
    'It is one of the most common and most invisible installation faults: everything looks ' +
    'connected, and the system is quietly starved. Pull it taut, support it at proper intervals, ' +
    'and avoid tight bends.',
  source: cite.todo('Confirm flex duct installation guidance against your text and ACCA Manual D.'),
  status: 'draft',
});

const registerBalancing = defineQuestion({
  ...T,
  id: 'hvac.6.5.closing-registers',
  objective: '6.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A customer has closed the registers in unused rooms to "save energy". What does that actually do?',
  choices: [
    'Raises system static pressure and reduces total airflow, which can ice the coil',
    'Saves energy proportional to the rooms closed',
    'Has no measurable effect',
    'Improves airflow to the remaining rooms with no downside',
  ],
  answer: 0,
  explain:
    'A duct system is designed for a total airflow. Closing registers does not remove that air — it ' +
    'forces the same blower to push the same volume through a smaller opening, raising static ' +
    'pressure and reducing total flow.\n\n' +
    'On a cooling system, less airflow means a colder coil, which can ice. On a furnace it can trip ' +
    'the high limit.\n\n' +
    'It also does not save much: the equipment still runs, and duct leakage into unconditioned ' +
    'space usually goes **up** with the higher pressure. Zoning with proper dampers and controls is ' +
    'the real version of this idea.',
  source: cite.todo('Confirm the closed register discussion against your text.'),
  status: 'draft',
});

const filterChangeInterval = defineQuestion({
  ...T,
  id: 'hvac.6.6.when-to-change',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What is the most reliable way to decide when a filter needs changing?',
  choices: [
    'Measure the pressure drop across it and compare with its clean value',
    'Change it every 30 days regardless',
    'Change it when it looks dirty',
    'Change it when the system stops cooling well',
  ],
  answer: 0,
  explain:
    'Pressure drop is what actually matters, and it is measurable. A filter at twice its clean drop ' +
    'is costing real airflow whether or not it looks bad.\n\n' +
    'A calendar interval is a reasonable default for a homeowner but ignores how the house actually ' +
    'loads the filter — pets, construction, a dusty season.\n\n' +
    'Appearance is misleading in both directions: a filter can look grey and still flow fine, or ' +
    'look acceptable while a fine media has loaded up. Waiting for a comfort complaint means the ' +
    'coil has already been running starved for weeks.',
  source: cite.todo('Confirm filter maintenance guidance against your text.'),
  status: 'draft',
});

export const SECTOR_6_EXTRA: readonly Question[] = [
  cfmFromCapacity,
  returnGrilleVelocity,
  staticPressureProbe,
  componentPressureDrop,
  fanCurve,
  flexDuctCompression,
  registerBalancing,
  filterChangeInterval,
];
