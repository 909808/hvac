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

// --- more 4.1 ---------------------------------------------------------------

const looseBulb = defineQuestion({
  ...T,
  id: 'hvac.4.1.loose-bulb',
  objective: '4.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A TXV system shows near-zero superheat and the suction line is sweating back to the ' +
    'compressor. The charge was weighed in correctly last week.\n\nWhat should you check first?',
  choices: [
    'Whether the TXV sensing bulb is still properly clamped and insulated on the suction line',
    'The condenser coil for dirt',
    'The compressor windings',
    'The outdoor fan motor',
  ],
  answer: 0,
  explain:
    'A bulb that has come loose senses room air instead of the suction line. Room air is warm ' +
    'compared to a suction line, so the valve reads that as "far too much superheat" and holds ' +
    'itself wide open — flooding the evaporator.\n\n' +
    'The charge being known-correct is what points here rather than at an overcharge. Both produce ' +
    'low superheat, but only one of them is consistent with a charge you weighed in yourself.\n\n' +
    'It is a mundane fix and a genuinely common one. Re-secure the bulb, clean contact, proper ' +
    'clamp, insulated over the top, at 10 or 2 o\'clock on a horizontal line.',
  source: cite.todo('Confirm the TXV bulb failure discussion against your text.'),
  status: 'draft',
});

const bulbPosition = defineQuestion({
  ...T,
  id: 'hvac.4.1.bulb-clock-position',
  objective: '4.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why is a TXV sensing bulb mounted at the 10 or 2 o\'clock position on a horizontal suction line, ' +
    'rather than at the bottom?',
  choices: [
    'Oil pools in the bottom of the line, so a bulb there would sense the oil rather than the refrigerant',
    'The bottom of the line is physically harder to reach',
    'Mounting at the bottom would strain the capillary',
    'The bottom of the line is colder',
  ],
  answer: 0,
  explain:
    'Oil returning through the system runs along the bottom of a horizontal line. A bulb clamped ' +
    'there senses the oil temperature, which lags and misrepresents what the refrigerant is doing.\n\n' +
    'The 10 or 2 o\'clock positions get good contact with the pipe wall where refrigerant is ' +
    'actually flowing. On larger lines the very top is also avoided, because vapour stratifies ' +
    'there.\n\n' +
    'A poorly positioned bulb produces a valve that hunts and never settles — and gets diagnosed ' +
    'as a bad TXV when the valve is perfectly fine.',
  source: cite.todo('Confirm bulb mounting practice against your text and manufacturer instructions.'),
  status: 'draft',
});

const eevAdvantage = defineQuestion({
  ...T,
  id: 'hvac.4.1.eev-advantage',
  objective: '4.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What does an electronic expansion valve offer over a thermostatic one?',
  choices: [
    'Faster response and a much wider operating range, because a controller drives it rather than a bulb charge',
    'It needs no superheat measurement at all',
    'It eliminates the need for a filter drier',
    'It works without electrical power',
  ],
  answer: 0,
  explain:
    'A TXV is a mechanical device: bulb pressure against spring and evaporator pressure. It works ' +
    'well but it responds slowly and only over the range its charge was designed for.\n\n' +
    'An EEV uses a temperature sensor and a pressure transducer feeding a controller, which drives ' +
    'a stepper motor. That gives much finer control, faster response to load changes, and the ' +
    'ability to hold tight superheat across a wide range — which is what variable-capacity and ' +
    'inverter systems need.\n\n' +
    'The trade is complexity: it needs power, a controller and sensors, and any of those can fail.',
  source: cite.todo('Confirm the EEV discussion against your text.'),
  status: 'draft',
});

// --- more 4.2 / 4.3 ---------------------------------------------------------

const wetBulbNotDry = defineQuestion({
  ...T,
  id: 'hvac.4.2.why-wet-bulb',
  objective: '4.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A superheat charging chart uses indoor WET bulb rather than dry bulb.\n\nWhy?',
  choices: [
    'Wet bulb reflects total heat content, including the moisture the coil must also remove',
    'Wet bulb is easier to measure accurately',
    'Dry bulb varies too much through the day',
    'Wet bulb is the same as the coil temperature',
  ],
  answer: 0,
  explain:
    'The coil does two jobs: lowering temperature and condensing moisture. Dry bulb only describes ' +
    'the first.\n\n' +
    'Wet bulb captures the total heat content of the entering air — sensible and latent together — ' +
    'which is what actually determines how hard the evaporator is working, and therefore what ' +
    'superheat it should be running.\n\n' +
    'Using dry bulb gives the wrong target, and in a humid climate it can be wrong by a lot. That ' +
    'is why a psychrometer belongs in the bag alongside the gauges.',
  source: cite.todo('Confirm against a manufacturer superheat charging chart.'),
  status: 'draft',
});

const subcoolingCalculation = defineQuestion({
  ...T,
  id: 'hvac.4.3.subcool-target-check',
  objective: '4.3',
  kind: 'input',
  difficulty: 2,
  prompt:
    'An R-410A TXV system reads 340 psig on the high side (≈105°F saturation) and the liquid line ' +
    'measures 95°F.\n\nWhat is the subcooling, in °F?',
  placeholder: '°F',
  accept: ['10'],
  tolerance: 2,
  explain:
    'Subcooling = condensing temperature − liquid line temperature = 105 − 95 = **10°F**.\n\n' +
    'That sits right in the 8–12°F target band, so on a TXV system this says the charge is ' +
    'correct. Check the nameplate — many manufacturers specify a subcooling target, and it takes ' +
    'precedence over the generic band.',
  source: cite.standard('Arithmetic: 105 − 95'),
  status: 'verified',
});

const chargeInWrongWeather = defineQuestion({
  ...T,
  id: 'hvac.4.3.low-ambient-charging',
  objective: '4.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'It is 55°F outside and you need to verify the charge on a cooling system.\n\n' +
    'What is the problem, and what should you do?',
  choices: [
    'Charging charts assume higher ambients; weigh the charge in instead, or use a low-ambient procedure',
    'Nothing — charge by superheat as usual',
    'Add refrigerant until suction pressure looks normal for summer',
    'Wait for the system to reach steady state, then charge normally',
  ],
  answer: 0,
  explain:
    'Below roughly 65°F outdoor ambient, the readings a charging chart expects do not appear. Head ' +
    'pressure is low, the system may not even run properly, and superheat and subcooling both ' +
    'drift outside their normal relationships.\n\n' +
    'The reliable answer is to **weigh it in**: recover, evacuate, and put in the nameplate charge ' +
    'with the line-set adjustment. That is accurate regardless of weather.\n\n' +
    'Some manufacturers publish a low-ambient charging procedure, sometimes involving temporarily ' +
    'restricting condenser airflow. Where one exists, follow it rather than improvising.',
  source: cite.todo('Confirm low-ambient charging guidance against your text and manufacturer literature.'),
  status: 'draft',
});

// --- more 4.4 / 4.5 ---------------------------------------------------------

const lineSetShort = defineQuestion({
  ...T,
  id: 'hvac.4.4.short-line-set',
  objective: '4.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A nameplate reads "factory charge 6 lb 0 oz for 15 ft of line set". The installed line set is ' +
    '10 ft.\n\nWhat should you do?',
  choices: [
    'Check the manufacturer instructions — some specify removing charge for runs shorter than the base length',
    'Add the full 6 lb regardless; short runs need no adjustment',
    'Reduce the charge by a fixed 10%',
    'Add extra charge, since a shorter line set restricts flow',
  ],
  answer: 0,
  explain:
    'The nameplate figure covers the equipment plus a stated length of line set. A run shorter than ' +
    'that holds less refrigerant, and some manufacturers do specify a deduction.\n\n' +
    'Many say nothing, in which case the base charge stands — the difference over a few feet is ' +
    'usually within tolerance. The point is that you read the instructions rather than assume ' +
    'either way.\n\n' +
    'Verify with subcooling once it is running. Weighing in establishes the charge; the readings ' +
    'confirm it.',
  source: cite.todo('Confirm line set adjustment guidance against manufacturer literature.'),
  status: 'draft',
});

const restrictionNotLeak = defineQuestion({
  ...T,
  id: 'hvac.4.5.dont-add-to-restriction',
  objective: '4.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system shows 30°F superheat and 20°F subcooling.\n\n' +
    'A technician adds two pounds of refrigerant because the superheat is high. What happens?',
  choices: [
    'It gets worse — the restriction is unchanged and the system is now overcharged as well',
    'Superheat comes down and the problem is solved',
    'Nothing changes, since the restriction controls flow',
    'The extra charge clears the restriction',
  ],
  answer: 0,
  explain:
    'High superheat with **high** subcooling is a restriction, not an undercharge. Refrigerant is ' +
    'backing up behind the blockage — which is exactly why subcooling is high.\n\n' +
    'Adding more refrigerant does not open the restriction. It stacks even more liquid in the ' +
    'condenser, driving head pressure and subcooling higher still, while the evaporator stays just ' +
    'as starved.\n\n' +
    'Then when somebody eventually finds and clears the restriction, the system is badly ' +
    'overcharged and has to be recovered down. Reading superheat alone, without subcooling, is how ' +
    'this happens.',
  source: cite.todo('Confirm the restriction signature against your service text.'),
  status: 'draft',
});

const flashGas = defineQuestion({
  ...T,
  id: 'hvac.4.5.flash-gas',
  objective: '4.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system has adequate charge but the liquid line is long with a significant vertical rise. It ' +
    'behaves as though it were undercharged.\n\nWhat is likely happening?',
  choices: [
    'Flash gas — pressure drop in the line is vaporising some liquid before it reaches the metering device',
    'The refrigerant is leaking from the vertical section',
    'The compressor cannot lift refrigerant that high',
    'The metering device is too large',
  ],
  answer: 0,
  explain:
    'A metering device is sized to pass liquid. If refrigerant arrives at or near saturation, any ' +
    'pressure drop — a long run, a vertical lift, a restrictive drier — flashes some of it to ' +
    'vapour.\n\n' +
    'Vapour occupies far more volume than liquid, so the device passes much less refrigerant than ' +
    'it should, and the evaporator starves. The symptom looks exactly like an undercharge.\n\n' +
    'Subcooling is the margin that prevents it: more subcooling means more room to lose pressure ' +
    'before reaching saturation. This is why a long or lifted liquid line needs a healthy ' +
    'subcooling figure rather than a marginal one.',
  source: cite.todo('Confirm the flash gas discussion against your text.'),
  status: 'draft',
});

export const SECTOR_4_QUESTIONS: readonly Question[] = [
  meteringComparison,
  txvComponents,
  looseBulb,
  bulbPosition,
  eevAdvantage,
  whichMethod,
  fixedOrificeCharging,
  wetBulbNotDry,
  subcoolingCalculation,
  chargeInWrongWeather,
  weighInCharge,
  lineSetShort,
  chargeSignatures,
  restrictionNotLeak,
  overchargeConsequence,
  flashGas,
  nonCondensableCause,
];
