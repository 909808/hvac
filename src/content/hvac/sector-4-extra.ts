import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 4 — additional questions. Continuation of `sector-4-charging.ts`. */

const T = { track: 'hvac', domain: '4.0' } as const;

const pistonSizing = defineQuestion({
  ...T,
  id: 'hvac.4.1.piston-sizing',
  objective: '4.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A condenser is matched to a larger indoor coil than the one it shipped with. What must be checked?',
  choices: [
    'The metering device — a fixed orifice is sized for a specific coil and capacity',
    'The line set colour coding',
    'The thermostat wire gauge',
    'Nothing; coils are interchangeable within a brand',
  ],
  answer: 0,
  explain:
    'A fixed orifice is a hole of a specific size, chosen for a specific combination of coil and ' +
    'capacity. Change the coil and the correct orifice usually changes with it.\n\n' +
    'Too small and the coil starves — high superheat, low capacity. Too large and it overfeeds — ' +
    'low superheat and floodback risk.\n\n' +
    'Manufacturers publish matched combinations with the required piston size. A mismatched system ' +
    'can look like a charge problem forever, because the readings never come right no matter how ' +
    'much refrigerant you move.',
  source: cite.todo('Confirm piston sizing guidance against manufacturer literature.'),
  status: 'draft',
});

const txvHunting = defineQuestion({
  ...T,
  id: 'hvac.4.1.txv-hunting',
  objective: '4.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Suction pressure swings up and down every minute or so, and superheat swings with it.\n\n' +
    'What is this called and what usually causes it?',
  choices: [
    'Hunting — usually a poorly mounted or poorly insulated sensing bulb, or an oversized valve',
    'Short cycling, caused by a faulty thermostat',
    'Slugging, caused by an overcharge',
    'Flash gas, caused by a restriction',
  ],
  answer: 0,
  explain:
    'Hunting is a control loop oscillating: the valve overshoots, superheat drops, the valve ' +
    'closes too far, superheat climbs, and round it goes.\n\n' +
    'The usual causes are a bulb that senses badly — loose, uninsulated, or on the bottom of the ' +
    'line where oil pools — so it lags and the valve keeps over-correcting. An oversized valve does ' +
    'the same thing because small movements produce large flow changes.\n\n' +
    'Fix the bulb mounting first. It costs nothing and it is the cause far more often than a valve ' +
    'that genuinely needs replacing.',
  source: cite.todo('Confirm the hunting discussion against your text.'),
  status: 'draft',
});

const equalisedPressures = defineQuestion({
  ...T,
  id: 'hvac.4.2.equalised-pressure-meaning',
  objective: '4.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system has been off for several hours. Both gauges read 130 psig on an R-410A system at 50°F ' +
    'ambient.\n\nWhat does that tell you?',
  choices: [
    'The pressures have equalised at the saturation pressure for ambient — the system has refrigerant in it',
    'The system is overcharged',
    'The compressor has failed',
    'There is a restriction between the two sides',
  ],
  answer: 0,
  explain:
    'With the system off long enough, high and low sides equalise, and the pressure settles at the ' +
    'saturation pressure for the surrounding temperature. R-410A at 50°F is about 143 psig, so 130 ' +
    'at 50°F ambient is in the right region.\n\n' +
    'What this **does** tell you: there is liquid refrigerant present. What it does **not** tell ' +
    'you: how much. A system with two pounds and one with eight will read the same standing ' +
    'pressure.\n\n' +
    'A standing pressure well below saturation for ambient means the charge is gone — you are ' +
    'reading vapour only.',
  source: cite.standard('Saturation pressure at ambient — P-T relationship'),
  status: 'verified',
});

const superheatTargetHigh = defineQuestion({
  ...T,
  id: 'hvac.4.2.chart-direction',
  objective: '4.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'On a fixed-orifice charging chart, what happens to target superheat as outdoor temperature rises?',
  choices: [
    'It falls — a hotter condenser raises head pressure, which pushes more refrigerant through the orifice',
    'It rises, because the system works harder',
    'It stays constant; only indoor conditions matter',
    'It becomes undefined above 95°F',
  ],
  answer: 0,
  explain:
    'A fixed orifice passes refrigerant according to the pressure difference across it. Hotter ' +
    'outside means higher head pressure, a bigger difference, and more flow — so the coil is better ' +
    'fed and superheat falls.\n\n' +
    'Indoor wet bulb pushes the other way: more load means more heat to boil, and superheat rises.\n\n' +
    'That is why the chart needs both numbers. Reading it with only one is guessing, and using ' +
    'indoor **dry** bulb instead of wet bulb gets it wrong in a humid climate by a wide margin.',
  source: cite.todo('Confirm against a manufacturer superheat charging chart.'),
  status: 'draft',
});

const subcoolingNameplate = defineQuestion({
  ...T,
  id: 'hvac.4.3.nameplate-subcooling',
  objective: '4.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A condenser nameplate specifies "subcooling 8°F" but the generic target is 8–12°F.\n\n' +
    'Which do you charge to?',
  choices: [
    'The nameplate — the manufacturer knows the equipment better than a general rule does',
    'The middle of the generic range, 10°F',
    'Whichever is easier to hit',
    'The generic range, since nameplates are often out of date',
  ],
  answer: 0,
  explain:
    'The 8–12°F band is a reasonable default when nothing else is specified. A nameplate figure is ' +
    'not a default — it is the value that unit was designed and tested around.\n\n' +
    'Charging to 12°F on a unit specified at 8°F leaves it meaningfully overcharged, with higher ' +
    'head pressure and higher running cost.\n\n' +
    'Same principle throughout: manufacturer instructions beat general rules, and the general rules ' +
    'exist for when there are no instructions to hand.',
  source: cite.todo('Confirm charging precedence against manufacturer literature.'),
  status: 'draft',
});

const chargeRemoval = defineQuestion({
  ...T,
  id: 'hvac.4.3.removing-charge',
  objective: '4.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'You need to remove half a pound of refrigerant from an overcharged system. How?',
  choices: [
    'Recover it into a cylinder on a scale',
    'Bleed it slowly from the low side to atmosphere',
    'Bleed it from the high side, which is faster',
    'Leave it — an overcharge is less harmful than an undercharge',
  ],
  answer: 0,
  whyWrong: {
    1: 'Venting is illegal regardless of quantity or how slowly it is done.',
    2: 'Also venting, and faster is not better here.',
    3: 'An overcharge raises head pressure, amps and compressor stress, and can cause floodback.',
  },
  explain:
    'Recovery, onto a scale so you know how much came out. There is no legal way to vent, and no ' +
    'threshold below which it becomes acceptable.\n\n' +
    'Take out a measured amount, let the system stabilise for ten to fifteen minutes, then ' +
    're-read subcooling. Removing refrigerant in small increments and re-measuring is slower than ' +
    'guessing but it is the only way to land on target.',
  source: cite.standard('40 CFR §82.154 (venting prohibition)'),
  status: 'verified',
});

const stabiliseTime = defineQuestion({
  ...T,
  id: 'hvac.4.4.let-it-stabilise',
  objective: '4.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You have just added refrigerant. How long should you wait before reading superheat and subcooling?',
  choices: [
    'Ten to fifteen minutes of steady running',
    'Thirty seconds — the readings respond immediately',
    'One hour minimum',
    'No wait is needed if the system was already running',
  ],
  answer: 0,
  explain:
    'The system needs time to redistribute the charge and settle at a new operating point. Readings ' +
    'taken immediately reflect the transient, not the state you are trying to measure.\n\n' +
    'Add a small amount, wait, read, repeat. Adding continuously while watching the gauges is how ' +
    'systems get overcharged: the readings lag, you keep going, and by the time they catch up you ' +
    'have gone past.\n\n' +
    'The same applies to any change — airflow, a metering device swap, anything.',
  source: cite.todo('Confirm the stabilisation guidance against your text.'),
  status: 'draft',
});

const whichSideToCharge = defineQuestion({
  ...T,
  id: 'hvac.4.4.charging-side',
  objective: '4.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You are charging a running R-410A system with liquid. Where do you introduce it, and how?',
  choices: [
    'Into the suction line through a metering restrictor, slowly, so it flashes before reaching the compressor',
    'Into the suction line directly, since the compressor will handle it',
    'Into the liquid line while the system runs',
    'Into the discharge line',
  ],
  answer: 0,
  whyWrong: {
    1: 'Liquid straight into the suction line slugs the compressor.',
    2: 'You cannot push liquid into the high side against discharge pressure while running.',
    3: 'Never — that is the highest pressure point in the system.',
  },
  explain:
    'R-410A is a blend, so it must leave the cylinder as **liquid** to keep its proportions right. ' +
    'But liquid must not reach the compressor.\n\n' +
    'The resolution is to meter it into the suction line slowly, through a restrictor built into ' +
    'the hose or the manifold, so it flashes to vapour on the way. Small amounts, with the ' +
    'cylinder upright and the liquid valve open.\n\n' +
    'The alternative is charging into the high side with the system **off**, which is how a weighed ' +
    'charge normally goes in after an evacuation.',
  source: cite.todo('Confirm blend charging procedure against your text and manufacturer instructions.'),
  status: 'draft',
});

export const SECTOR_4_EXTRA: readonly Question[] = [
  pistonSizing,
  txvHunting,
  equalisedPressures,
  superheatTargetHigh,
  subcoolingNameplate,
  chargeRemoval,
  stabiliseTime,
  whichSideToCharge,
];
