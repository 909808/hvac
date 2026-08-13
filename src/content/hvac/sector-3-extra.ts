import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 3 — additional questions. Continuation of `sector-3-refrigerants.ts`. */

const T = { track: 'hvac', domain: '3.0' } as const;

const numberingSystem = defineQuestion({
  ...T,
  id: 'hvac.3.1.numbering-series',
  objective: '3.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each refrigerant number series to what it contains.',
  pairs: [
    ['R-11 to R-59', 'Methane, ethane and propane derived compounds'],
    ['R-400 series', 'Zeotropic blends — components with different boiling points'],
    ['R-500 series', 'Azeotropic blends — behave as a single substance'],
    ['R-700 series', 'Inorganic compounds, numbered by molecular weight'],
  ],
  explain:
    'The 400 versus 500 distinction has a practical consequence. Zeotropic blends have temperature ' +
    'glide and must be charged as liquid, because the components would separate if you drew vapour.\n\n' +
    'Azeotropic blends behave as one substance, so glide is effectively zero and they can be ' +
    'charged either way.\n\n' +
    'The 700 series numbering is literal: ammonia has a molecular weight of 17, so it is R-717. ' +
    'Carbon dioxide is 44, so R-744.',
  source: cite.todo('Confirm the numbering system against your text or ASHRAE Standard 34.'),
  status: 'draft',
});

const glideMeaning = defineQuestion({
  ...T,
  id: 'hvac.3.1.temperature-glide',
  objective: '3.1',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What is temperature glide in a zeotropic blend?',
  choices: [
    'The temperature changes during evaporation or condensation at constant pressure, so bubble and dew points differ',
    'The refrigerant temperature drifts over the life of the system',
    'The rate at which the coil temperature falls at startup',
    'The difference between suction and discharge temperature',
  ],
  answer: 0,
  explain:
    'In a pure refrigerant, boiling happens at one temperature for a given pressure. In a zeotropic ' +
    'blend the more volatile component boils first, so the temperature rises through the process ' +
    'even though pressure is constant.\n\n' +
    'That means two saturation temperatures for the same pressure: the **bubble point** (where ' +
    'boiling starts) and the **dew point** (where it finishes). Superheat is calculated from the ' +
    'dew point, subcooling from the bubble point.\n\n' +
    'R-410A has almost no glide, which is why it can be treated with a single P-T column. Blends ' +
    'with significant glide need a P-T chart with both columns, and using the wrong one puts your ' +
    'superheat out by several degrees.',
  source: cite.todo('Confirm the glide discussion against your text.'),
  status: 'draft',
});

const oilReturn = defineQuestion({
  ...T,
  id: 'hvac.3.2.oil-return',
  objective: '3.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Oil circulates with the refrigerant. What piping detail helps it get back to the compressor on a vertical suction riser?',
  choices: [
    'Adequate refrigerant velocity, and a trap at the base of the riser',
    'A larger line size, to reduce pressure drop',
    'Insulating the riser',
    'Sloping the riser away from the compressor',
  ],
  answer: 0,
  whyWrong: {
    1: 'Oversizing the line lowers velocity, which makes oil return worse rather than better.',
    2: 'Insulation affects heat gain, not oil movement.',
    3: 'Oil has to travel up the riser regardless of slope.',
  },
  explain:
    'Oil climbs a vertical riser by being dragged along the pipe wall by the refrigerant vapour. ' +
    'That needs velocity — which is why suction lines are sized for velocity as well as pressure ' +
    'drop, and why an oversized line is a genuine fault rather than a harmless margin.\n\n' +
    'A trap at the base collects oil until there is enough to be carried up as a slug.\n\n' +
    'Oil that never returns sits in the evaporator, where it insulates the coil and starves the ' +
    'compressor of lubrication at the same time.',
  source: cite.todo('Confirm oil return piping practice against your text.'),
  status: 'draft',
});

const recoveryMethods = defineQuestion({
  ...T,
  id: 'hvac.3.3.vapour-vs-liquid-recovery',
  objective: '3.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why is liquid recovery faster than vapour recovery on a large system?',
  choices: [
    'Liquid is far denser, so far more mass moves per unit of volume the machine handles',
    'Liquid recovery uses a larger hose',
    'Vapour recovery requires a deeper vacuum',
    'The recovery machine runs at a higher speed on liquid',
  ],
  answer: 0,
  explain:
    'A recovery machine can only move so much volume per minute. Liquid refrigerant is hundreds of ' +
    'times denser than vapour, so each unit of volume carries vastly more mass.\n\n' +
    'The usual approach on a large charge is push-pull: recover the bulk as liquid first, then ' +
    'switch to vapour to clear what is left. On a small residential system it is not worth the ' +
    'extra setup.\n\n' +
    'Recovery machines are not compressors in the refrigeration sense — most cannot handle liquid ' +
    'entering the cylinder, so push-pull routes the liquid around the machine rather than through it.',
  source: cite.todo('Confirm recovery procedures against your text and EPA 608 material.'),
  status: 'draft',
});

const cylinderColour = defineQuestion({
  ...T,
  id: 'hvac.3.4.recovery-cylinder-identification',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'How is a recovery cylinder distinguished from a virgin refrigerant cylinder?',
  choices: [
    'Recovery cylinders are grey with a yellow shoulder and must be DOT-approved and periodically retested',
    'Recovery cylinders are always blue',
    'There is no physical distinction; only the label differs',
    'Recovery cylinders have no pressure relief device',
  ],
  answer: 0,
  explain:
    'Grey body, yellow shoulder is the standard marking for recovery cylinders in the US. They are ' +
    'DOT-approved pressure vessels and require periodic hydrostatic retesting — the date is stamped ' +
    'on the collar.\n\n' +
    'Virgin refrigerant used to be colour-coded by type, though that convention has become less ' +
    'reliable and the label is what you should read.\n\n' +
    'Never recover into a disposable cylinder. They are single-use, not rated for refilling, and ' +
    'refilling one is both illegal and genuinely dangerous.',
  source: cite.todo('Confirm cylinder marking and retest requirements against DOT rules and your text.'),
  status: 'draft',
});

const leakDetectorTypes = defineQuestion({
  ...T,
  id: 'hvac.3.5.leak-detection-methods',
  objective: '3.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each leak detection method to its strength.',
  pairs: [
    ['Electronic detector', 'Sensitive and fast for locating a leak in a general area'],
    ['Bubble solution', 'Cheap and unambiguous once you know roughly where to look'],
    ['UV dye', 'Finds intermittent leaks that only appear under certain conditions'],
    ['Nitrogen pressure test', 'Confirms whether a repaired system holds, before charging'],
    ['Ultrasonic detector', 'Hears the hiss of a leak in a noisy environment'],
  ],
  explain:
    'They are complementary rather than competing. Electronic detectors narrow it down, bubbles ' +
    'confirm the exact spot, and dye catches the leaks that only show up on a hot afternoon under ' +
    'full load.\n\n' +
    'The one to be careful with is dye: some manufacturers void warranty over it, and it ' +
    'contaminates recovery equipment. Check before using it.\n\n' +
    'Whatever finds the leak, a **nitrogen pressure test** is what proves the repair before you ' +
    'spend refrigerant on it.',
  source: cite.todo('Confirm leak detection methods against your text.'),
  status: 'draft',
});

const tripleEvacuation = defineQuestion({
  ...T,
  id: 'hvac.3.5.triple-evacuation',
  objective: '3.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'What is triple evacuation, and when is it used?',
  choices: [
    'Pull a vacuum, break it with dry nitrogen, and repeat — used on badly contaminated or wet systems',
    'Evacuating three separate sections of a system in turn',
    'Running the vacuum pump for three hours',
    'Using three vacuum pumps in parallel',
  ],
  answer: 0,
  explain:
    'Each nitrogen break sweeps the system and mixes with the remaining moisture, so the next pull ' +
    'removes far more than continuing to pump would. Three cycles is dramatically more effective ' +
    'than one long one on a wet system.\n\n' +
    'It is not needed on a clean system that pulls straight down to 500 microns and holds. Reach ' +
    'for it when the decay test keeps plateauing around 1,500–2,000 microns, which is the signature ' +
    'of moisture still boiling off.\n\n' +
    'Use dry nitrogen for the breaks, never air — air brings its own moisture back in.',
  source: cite.todo('Confirm the triple evacuation procedure against your text.'),
  status: 'draft',
});

const leakRepairRule = defineQuestion({
  ...T,
  id: 'hvac.3.6.leak-rate-thresholds',
  objective: '3.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Under the EPA rules, what happens when an appliance with a large charge exceeds its leak rate threshold?',
  choices: [
    'The owner must repair the leak within a set period and verify the repair, with records kept',
    'Nothing, as long as the refrigerant is replaced',
    'The appliance must be replaced immediately',
    'Only equipment containing CFCs is affected',
  ],
  answer: 0,
  explain:
    'Appliances above a threshold charge size have annual leak rate limits. Exceed one and the ' +
    'owner is required to repair, verify the repair, and keep records — or develop a retrofit or ' +
    'retirement plan.\n\n' +
    'The thresholds and timeframes differ by equipment type (commercial refrigeration, industrial ' +
    'process refrigeration, comfort cooling), and the rules have been amended more than once, so ' +
    'check the current text of 40 CFR Part 82 Subpart F rather than relying on memory.\n\n' +
    'The principle is stable even when the numbers move: repeatedly topping up a known leaker is ' +
    'not a compliance strategy.',
  source: cite.standard('40 CFR Part 82, Subpart F — leak repair provisions'),
  status: 'verified',
});

const recordKeeping = defineQuestion({
  ...T,
  id: 'hvac.3.6.records',
  objective: '3.6',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What must a technician keep as proof of Section 608 certification?',
  choices: [
    'A copy of the certification card or record, available for inspection',
    'Nothing — the EPA maintains a searchable register',
    'A renewal certificate, since certification expires every five years',
    'Only the employer must keep records',
  ],
  answer: 0,
  whyWrong: {
    1: 'There is no universal public register a technician can rely on in place of their own proof.',
    2: 'Section 608 certification does not expire.',
    3: 'The technician is responsible for their own proof of certification.',
  },
  explain:
    'You keep proof and produce it on request. Certification does not expire, so there is no ' +
    'renewal — but losing the card does not remove the requirement to demonstrate it.\n\n' +
    'Separately, refrigerant **sales** are restricted to certified technicians, so suppliers will ' +
    'ask for it too. Keeping a photo of the card on your phone solves most of this in practice.',
  source: cite.standard('40 CFR §82.161, §82.164'),
  status: 'verified',
});

export const SECTOR_3_EXTRA: readonly Question[] = [
  numberingSystem,
  glideMeaning,
  oilReturn,
  recoveryMethods,
  cylinderColour,
  leakDetectorTypes,
  tripleEvacuation,
  leakRepairRule,
  recordKeeping,
];
