import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 4 — Metering Devices & Charging. */

const T = { track: 'hvac', domain: '4.0' } as const;

// --- 4.1 Metering devices ---------------------------------------------------

const meteringComparison = defineQuestion({
  ...T,
  id: 'hvac.4.1.device-comparison',
  objective: '4.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each metering device to how it behaves.',
  pairs: [
    ['Fixed orifice / piston', 'No moving parts; flow varies only with pressure difference'],
    ['Capillary tube', 'A long small-bore tube; flow set by its length and diameter'],
    ['TXV', 'Modulates to hold a constant superheat as load changes'],
    ['EEV', 'Electronically controlled, with the widest operating range and fastest response'],
  ],
  explain:
    'The dividing line is whether the device responds to load. A fixed orifice or cap tube passes ' +
    'whatever the pressure difference pushes through it — cheap, reliable, and only correct at ' +
    'one operating condition. A TXV senses suction line temperature through its bulb and adjusts ' +
    'to hold superheat steady across a wide range.\n\n' +
    'This difference determines how you charge the system, which is the practical consequence ' +
    'worth remembering.',
  source: cite.todo('Confirm the device comparison against your text.'),
  status: 'draft',
});

const txvComponents = defineQuestion({
  ...T,
  id: 'hvac.4.1.txv-forces',
  objective: '4.1',
  kind: 'choice',
  difficulty: 3,
  prompt: 'Which three forces act on a thermostatic expansion valve diaphragm?',
  choices: [
    'Bulb pressure opening it, evaporator pressure and spring pressure closing it',
    'Bulb pressure closing it, evaporator pressure and spring pressure opening it',
    'Head pressure, suction pressure and ambient pressure',
    'Only bulb pressure and spring pressure',
  ],
  answer: 0,
  explain:
    'The sensing bulb, mounted on the suction line, is the opening force: as the line warms, the ' +
    'charge in the bulb expands and pushes the valve open to feed more refrigerant. Evaporator ' +
    'pressure and the adjustable superheat spring both push closed.\n\n' +
    'The valve settles wherever those balance, which is what holds superheat roughly constant. It ' +
    'also explains the classic failure: a bulb that has come loose senses room air instead of the ' +
    'suction line, reads that as "too warm", and holds the valve wide open — flooding the ' +
    'evaporator and driving superheat toward zero.\n\n' +
    'Bulb mounting matters. Clean contact, a proper clamp, insulation over it, and on horizontal ' +
    'line at the 10 or 2 o\'clock position so it senses liquid in the line rather than oil in the ' +
    'bottom of it.',
  source: cite.todo('Confirm the TXV force balance against your text.'),
  status: 'draft',
});

// --- 4.2 and 4.3 Charging methods --------------------------------------------

const whichMethod = defineQuestion({
  ...T,
  id: 'hvac.4.2.method-by-device',
  objective: '4.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You are charging a system that has a TXV.\n\nWhich measurement should you charge by, and why?',
  choices: [
    'Subcooling, because the TXV holds superheat constant regardless of charge',
    'Superheat, because it is the standard charging measurement',
    'Either, since both respond to charge equally',
    'Suction pressure alone',
  ],
  answer: 0,
  whyWrong: {
    1: 'Superheat is the fixed-orifice method. On a TXV it stays near 10°F whether the system is correctly charged or considerably over.',
    2: 'They do not respond equally — that is the entire point.',
    3: 'Suction pressure varies with load and ambient and cannot indicate charge on its own.',
  },
  explain:
    'A TXV modulates to hold superheat at its setting. Add refrigerant and the valve throttles ' +
    'back; remove some and it opens. Superheat therefore barely moves until the valve runs out of ' +
    'authority entirely, which means it cannot tell you about charge.\n\n' +
    'Subcooling can, because excess refrigerant has to go somewhere and the condenser is where it ' +
    'stacks up. Target is typically 8–12°F — check the nameplate, which often specifies it.\n\n' +
    'The rule to hold: TXV → charge by subcooling. Fixed orifice → charge by superheat, using the ' +
    'manufacturer\'s chart with indoor wet bulb and outdoor dry bulb.',
  source: cite.todo('Confirm the charging methods against your text and a manufacturer charging chart.'),
  status: 'draft',
});

const fixedOrificeCharging = defineQuestion({
  ...T,
  id: 'hvac.4.2.superheat-inputs',
  objective: '4.2',
  kind: 'multi',
  difficulty: 3,
  prompt:
    'To find the target superheat for a fixed-orifice system from the charging chart, which ' +
    'measurements do you need? Select all that apply.',
  choices: [
    'Indoor wet bulb temperature at the return',
    'Outdoor dry bulb temperature',
    'Liquid line temperature',
    'The refrigerant type',
  ],
  answers: [0, 1],
  explain:
    'The chart is indexed on indoor wet bulb and outdoor dry bulb, and nothing else. Those two ' +
    'describe the load the coil is seeing and the conditions the condenser is rejecting into.\n\n' +
    'Indoor WET bulb specifically, not dry bulb — because the coil\'s job includes removing ' +
    'moisture, and wet bulb is what captures the total heat content of the entering air. Using ' +
    'dry bulb gives the wrong target, often badly.\n\n' +
    'Liquid line temperature is for subcooling. The refrigerant type matters for converting ' +
    'pressure to saturation temperature, but it does not change the target superheat.',
  source: cite.todo('Confirm against a manufacturer superheat charging chart.'),
  status: 'draft',
});

// --- 4.4 Weighing in --------------------------------------------------------

const weighInCharge = defineQuestion({
  ...T,
  id: 'hvac.4.4.line-set-adjustment',
  objective: '4.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A condenser nameplate reads "factory charge 8 lb 4 oz, for 15 ft of line set. Add 0.6 oz per ' +
    'foot over 15 ft." The installed line set is 40 ft.\n\nWhat total charge should be weighed in?',
  choices: [
    '9 lb 3 oz',
    '8 lb 4 oz',
    '10 lb 8 oz',
    '8 lb 10 oz',
  ],
  answer: 0,
  explain:
    '40 ft − 15 ft = 25 ft of extra line. 25 × 0.6 oz = 15 oz. Adding that to 8 lb 4 oz gives ' +
    '8 lb 19 oz, which is 9 lb 3 oz.\n\n' +
    'Weighing in is the most accurate charging method available and the right approach after any ' +
    'repair where the system was evacuated. Superheat and subcooling then confirm the result ' +
    'rather than establishing it.\n\n' +
    'The line-set adjustment is not optional on a long run. A 40 ft line set holds meaningfully ' +
    'more refrigerant than a 15 ft one, and charging to the bare nameplate figure leaves the ' +
    'system undercharged.',
  source: cite.standard('Arithmetic: 8 lb 4 oz + (25 ft × 0.6 oz/ft)'),
  status: 'verified',
});

// --- 4.5 Reading the result --------------------------------------------------

const chargeSignatures = defineQuestion({
  ...T,
  id: 'hvac.4.5.signature-table',
  objective: '4.5',
  kind: 'match',
  difficulty: 3,
  prompt: 'Match each superheat/subcooling pairing to what it indicates.',
  pairs: [
    ['High superheat, low subcooling', 'Undercharge or a leak'],
    ['High superheat, high subcooling', 'Restriction in the liquid line or metering device'],
    ['Low superheat, high subcooling', 'Overcharge'],
    ['Low superheat, low subcooling', 'Metering device overfeeding'],
  ],
  explain:
    'This table is the single most useful thing in refrigerant-side diagnosis, and it only works ' +
    'when you read both numbers together.\n\n' +
    'Superheat alone cannot separate an undercharge from a restriction — both starve the ' +
    'evaporator and both drive superheat up. Subcooling is what distinguishes them: an ' +
    'undercharge has too little refrigerant to stack in the condenser, while a restriction backs ' +
    'refrigerant up behind it and stacks MORE.\n\n' +
    'Reading superheat alone and adding refrigerant to a restricted system makes it worse and ' +
    'leaves the system overcharged once the restriction is finally found.',
  source: cite.todo('Confirm the signature table against your service text.'),
  status: 'draft',
});

const overchargeConsequence = defineQuestion({
  ...T,
  id: 'hvac.4.5.overcharge-damage',
  objective: '4.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A technician tops up a system that was already correctly charged, because "the suction ' +
    'pressure looked a little low".\n\nWhat is the likely outcome?',
  choices: [
    'Higher head pressure, higher amps, reduced capacity, and risk of compressor damage',
    'Improved cooling and lower running cost',
    'No effect — systems tolerate extra refrigerant',
    'The excess refrigerant will vent through the relief valve',
  ],
  answer: 0,
  explain:
    'Excess refrigerant floods the lower condenser rows, reducing the surface available for ' +
    'condensing. Head pressure rises, compression ratio rises, amps rise, and capacity falls — ' +
    'the opposite of the intent.\n\n' +
    'Push it far enough and liquid reaches the compressor, at which point it stops being an ' +
    'efficiency question. Residential split systems have no relief valve to vent the excess.\n\n' +
    'Suction pressure on its own means very little. It varies with indoor load, airflow and ' +
    'ambient. Adding refrigerant on the basis of one gauge, without superheat and subcooling, is ' +
    'how correctly charged systems end up damaged.',
  source: cite.todo('Confirm the overcharge symptoms against your service text.'),
  status: 'draft',
});

const nonCondensableCause = defineQuestion({
  ...T,
  id: 'hvac.4.5.non-condensables-source',
  objective: '4.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system repaired last month now shows high head pressure and a high condenser split, but ' +
    'the coil is clean, the fan runs well, and subcooling is normal.\n\nWhat is the most likely cause?',
  choices: [
    'Non-condensables — air left in the system because it was not properly evacuated',
    'The condenser coil has become dirty since the repair',
    'The system is undercharged',
    'The metering device has failed',
  ],
  answer: 0,
  explain:
    'The contradiction is the clue. A high split says heat is not leaving the condenser, but a ' +
    'clean coil and a working fan say there is no physical reason for that. Air trapped in the ' +
    'system takes up condenser volume and adds its own partial pressure on top of the ' +
    'refrigerant\'s.\n\n' +
    'That it followed a repair points straight at evacuation. Air gets in when a system is opened ' +
    'and does not come out on its own — only a deep vacuum removes it, which is why the 500-micron ' +
    'target and the decay test exist.\n\n' +
    'The fix is recovery, evacuation and a fresh weighed charge. There is no way to bleed the air ' +
    'out selectively.',
  source: cite.todo('Confirm the non-condensable diagnosis against your service text.'),
  status: 'draft',
});

export const SECTOR_4_QUESTIONS: readonly Question[] = [
  meteringComparison,
  txvComponents,
  whichMethod,
  fixedOrificeCharging,
  weighInCharge,
  chargeSignatures,
  overchargeConsequence,
  nonCondensableCause,
];
