import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Sector 1 — additional questions.
 *
 * Split from `sector-1-fundamentals.ts` purely to keep files a readable length.
 * Same sector, same conventions; both are merged in `index.ts`.
 */

const T = { track: 'hvac', domain: '1.0' } as const;

const tempConversion = defineQuestion({
  ...T,
  id: 'hvac.1.1.f-to-c',
  objective: '1.1',
  kind: 'input',
  difficulty: 1,
  prompt: 'Convert 95°F to Celsius.',
  placeholder: '°C',
  accept: ['35'],
  tolerance: 1,
  explain:
    '°C = (°F − 32) × 5/9 = (95 − 32) × 5/9 = 63 × 0.5556 = **35°C**.\n\n' +
    'Two anchors worth carrying: 32°F = 0°C (water freezes) and 212°F = 100°C (water boils at ' +
    'sea level). −40 is the same in both scales, which is a useful sanity check on the arithmetic.',
  source: cite.standard('°C = (°F − 32) × 5/9'),
  status: 'verified',
});

const absoluteZero = defineQuestion({
  ...T,
  id: 'hvac.1.1.rankine',
  objective: '1.1',
  kind: 'choice',
  difficulty: 3,
  prompt: 'Why do thermodynamic calculations use absolute temperature scales like Rankine or Kelvin?',
  choices: [
    'Ratios only make sense from a true zero — 100°F is not "twice as hot" as 50°F',
    'They are more precise than Fahrenheit',
    'They avoid negative numbers in cold weather',
    'They are required by code',
  ],
  answer: 0,
  explain:
    'Fahrenheit and Celsius have arbitrary zero points, so their numbers cannot be multiplied or ' +
    'divided meaningfully. 100°F is not twice the thermal energy of 50°F.\n\n' +
    'Rankine starts at absolute zero: °R = °F + 459.67. Now ratios work, which is what gas law ' +
    'and psychrometric calculations need.\n\n' +
    'You will meet it in the psychrometric equations, where temperature always appears as °R.',
  source: cite.standard('°R = °F + 459.67'),
  status: 'verified',
});

const superheatIsSensible = defineQuestion({
  ...T,
  id: 'hvac.1.2.superheat-is-sensible',
  objective: '1.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Refrigerant has fully boiled in the evaporator and continues absorbing heat.\n\n' +
    'What kind of heat is it picking up now?',
  choices: [
    'Sensible heat — it is a vapour warming above its saturation temperature',
    'Latent heat, because it is still in the evaporator',
    'Both equally',
    'Neither; a fully boiled vapour absorbs no more heat',
  ],
  answer: 0,
  explain:
    'Latent heat is spent on the change of state. Once the last liquid has boiled, there is no ' +
    'more state to change — further heat simply raises the vapour temperature, which is sensible ' +
    'heat.\n\n' +
    'That temperature rise above saturation is exactly what **superheat** measures. Naming it ' +
    'this way makes the point clear: superheat is the sensible portion at the end of an otherwise ' +
    'latent process, and it is far less effective at moving heat, which is why a high superheat ' +
    'means wasted coil.',
  source: cite.standard('Sensible vs. latent heat — standard thermodynamics'),
  status: 'verified',
});

const btuCalc = defineQuestion({
  ...T,
  id: 'hvac.1.2.water-heating-calc',
  objective: '1.2',
  kind: 'input',
  difficulty: 2,
  prompt:
    'How much heat is needed to raise 40 pounds of water from 60°F to 140°F?\n\nAnswer in BTU.',
  placeholder: 'BTU',
  accept: ['3200'],
  tolerance: 60,
  explain:
    'Q = mass × specific heat × ΔT = 40 × 1.0 × (140 − 60) = 40 × 80 = **3,200 BTU**.\n\n' +
    'Water\'s specific heat is 1.0 BTU/lb·°F by definition, which makes it the easiest of these to ' +
    'compute — the mass and the temperature change are all you need.\n\n' +
    'This is the same arithmetic behind the hydronic formula, Q = 500 × GPM × ΔT. The 500 just ' +
    'converts gallons per minute into pounds per hour.',
  source: cite.standard('Q = m × c × ΔT'),
  status: 'verified',
});

const conductorInsulator = defineQuestion({
  ...T,
  id: 'hvac.1.4.why-copper',
  objective: '1.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why are evaporator and condenser coils made of copper and aluminium rather than steel?',
  choices: [
    'Both conduct heat far better than steel, so less surface area is needed',
    'They are cheaper than steel',
    'They resist corrosion better in all conditions',
    'They are lighter, which matters for shipping',
  ],
  answer: 0,
  explain:
    'A coil exists to move heat through a wall as fast as possible. Copper conducts heat roughly ' +
    'eight times better than steel, and aluminium about four times better.\n\n' +
    'Better conduction means a smaller, cheaper coil for the same capacity — which more than pays ' +
    'back the higher material cost.\n\n' +
    'This is also why dirt, oil film and scale hurt so much: every layer is thermal resistance in ' +
    'series with a wall that was engineered to have as little as possible.',
  source: cite.todo('Confirm thermal conductivity values against your text.'),
  status: 'draft',
});

const gaugeSetPorts = defineQuestion({
  ...T,
  id: 'hvac.1.5.manifold-ports',
  objective: '1.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each manifold gauge set connection to what it does.',
  pairs: [
    ['Blue, low side', 'Connects to the suction service valve'],
    ['Red, high side', 'Connects to the liquid or discharge service valve'],
    ['Yellow, centre', 'Goes to the vacuum pump, refrigerant cylinder or recovery machine'],
    ['Hand valves', 'Open or isolate the centre port from each side'],
  ],
  explain:
    'The two gauges read continuously whether the hand valves are open or shut — the valves only ' +
    'control whether the centre hose is connected to that side.\n\n' +
    'That is why you can take readings with both hand valves closed, and why leaving one open ' +
    'while changing a cylinder can dump refrigerant or draw air in.\n\n' +
    'Modern digital manifolds add pressure transducers and thermistors and compute superheat and ' +
    'subcooling for you, but the plumbing is identical.',
  source: cite.todo('Confirm the manifold description against your text.'),
  status: 'draft',
});

const thermometerPlacement = defineQuestion({
  ...T,
  id: 'hvac.1.5.insulate-the-probe',
  objective: '1.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why must a clamp thermocouple on a suction line be insulated from the surrounding air?',
  choices: [
    'Ambient air warms the probe, so an uninsulated reading overstates superheat',
    'Insulation protects the probe from mechanical damage',
    'It stops condensation shorting the thermocouple',
    'It keeps the probe from cooling the refrigerant',
  ],
  answer: 0,
  explain:
    'A suction line on a hot day might be 50°F while the air around it is 95°F. An exposed probe ' +
    'sits between the two and reads somewhere in the middle — too warm.\n\n' +
    'Since superheat is line temperature minus saturation temperature, an inflated line ' +
    'temperature inflates superheat directly. A few degrees of error is enough to push a correctly ' +
    'charged system into looking undercharged, and then somebody adds refrigerant.\n\n' +
    'Clean contact with the pipe, a proper clamp, and insulation taped over the top of it.',
  source: cite.todo('Confirm measurement technique against your text.'),
  status: 'draft',
});

const ppeChoice = defineQuestion({
  ...T,
  id: 'hvac.1.6.ppe-for-refrigerant',
  objective: '1.6',
  kind: 'multi',
  difficulty: 1,
  prompt: 'What PPE should you wear when connecting or disconnecting refrigerant hoses? Select all that apply.',
  choices: [
    'Safety glasses or goggles',
    'Gloves rated for cold',
    'A hard hat',
    'Closed-toe footwear',
  ],
  answers: [0, 1, 3],
  explain:
    'Liquid refrigerant boiling on skin causes instant frostbite, and a spray to the eyes can ' +
    'cause permanent damage. Eye protection and gloves are the two that address the actual hazard ' +
    'of this task; footwear is basic site sense.\n\n' +
    'A hard hat is required in plenty of environments but it is not what protects you from ' +
    'refrigerant. The point of PPE selection is matching the protection to the hazard, not wearing ' +
    'everything you own.',
  source: cite.todo('Confirm PPE requirements against your safety text and site policy.'),
  status: 'draft',
});

const ladderSafety = defineQuestion({
  ...T,
  id: 'hvac.1.6.working-at-height',
  objective: '1.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You are setting an extension ladder to reach a rooftop unit. What is the correct angle rule?',
  choices: [
    'Roughly 4 to 1 — base out one foot for every four feet of working height',
    'As steep as possible for stability',
    'Roughly 2 to 1',
    'Angle does not matter if the ladder is tied off',
  ],
  answer: 0,
  explain:
    'The 4:1 rule puts the ladder at about 75 degrees. Steeper and it tips backwards; shallower ' +
    'and the base slides out.\n\n' +
    'For roof access the ladder should also extend at least three feet above the landing so there ' +
    'is something to hold while stepping off, and it should be secured at the top.\n\n' +
    'Falls are among the most common serious injuries in this trade, and rooftop units mean you ' +
    'will be doing this constantly.',
  source: cite.standard('OSHA 29 CFR 1926.1053 (ladders)'),
  status: 'verified',
});

const arcFlash = defineQuestion({
  ...T,
  id: 'hvac.1.6.why-de-energise',
  objective: '1.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why is de-energising preferred over working live, even when live work seems quicker?',
  choices: [
    'Shock and arc flash are both eliminated rather than merely mitigated',
    'Meters read more accurately on dead circuits',
    'It is only a preference, not a safety matter',
    'Live work is fine with insulated tools',
  ],
  answer: 0,
  explain:
    'An arc flash releases enormous heat and pressure in milliseconds. PPE reduces injury; it does ' +
    'not prevent the event.\n\n' +
    'De-energising removes the hazard entirely, which is why safe work practice treats live work ' +
    'as something requiring justification rather than a default.\n\n' +
    'Some diagnostics genuinely require voltage present — measuring across a contactor coil, for ' +
    'instance. Do those deliberately, with the right PPE and the right meter category, and ' +
    'de-energise for everything else.',
  source: cite.standard('NFPA 70E'),
  status: 'verified',
});

export const SECTOR_1_EXTRA: readonly Question[] = [
  tempConversion,
  absoluteZero,
  superheatIsSensible,
  btuCalc,
  conductorInsulator,
  gaugeSetPorts,
  thermometerPlacement,
  ppeChoice,
  ladderSafety,
  arcFlash,
];
