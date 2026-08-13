import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 8 — additional questions. Continuation of `sector-8-heating.ts`. */

const T = { track: 'hvac', domain: '8.0' } as const;

const excessAir = defineQuestion({
  ...T,
  id: 'hvac.8.1.excess-air',
  objective: '8.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Combustion is set up with some excess air rather than the exact theoretical amount.\n\nWhy?',
  choices: [
    'Mixing is never perfect, so excess air ensures complete combustion — but too much wastes heat up the flue',
    'Excess air raises flame temperature',
    'It is required to keep the flue cool enough for PVC',
    'It reduces the amount of gas needed',
  ],
  answer: 0,
  explain:
    'In theory a precise air-to-fuel ratio burns everything. In a real burner the mixing is ' +
    'imperfect, so running at exactly stoichiometric would leave pockets of unburned fuel — which ' +
    'means carbon monoxide.\n\n' +
    'Excess air provides margin. But every extra cubic foot is heated and sent up the flue, so too ' +
    'much is pure loss.\n\n' +
    'A combustion analyser reads O₂ and CO₂ in the flue gas, which is how you find the balance. ' +
    'That is the instrument that actually answers "is this burning properly", and eyeballing the ' +
    'flame does not.',
  source: cite.todo('Confirm combustion tuning guidance against your text.'),
  status: 'draft',
});

const flameAppearance = defineQuestion({
  ...T,
  id: 'hvac.8.1.flame-colour',
  objective: '8.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A natural gas burner shows lazy yellow flames rather than crisp blue ones.\n\nWhat does that suggest?',
  choices: [
    'Insufficient primary air or a dirty burner — incomplete combustion, and possible carbon monoxide',
    'The gas pressure is too low',
    'Normal appearance for natural gas',
    'The heat exchanger is oversized',
  ],
  answer: 0,
  explain:
    'Properly aerated natural gas burns blue with a well-defined inner cone. Yellow, lazy, floating ' +
    'flames mean the fuel is not getting the air it needs, and unburned carbon is glowing.\n\n' +
    'Causes: blocked primary air openings, a dirty or rusted burner, lint and dust, or inadequate ' +
    'combustion air in the space.\n\n' +
    'Treat it as a CO concern, not an aesthetic one. Confirm with a combustion analyser rather than ' +
    'by eye — flame appearance is a prompt to measure, not a measurement.',
  source: cite.todo('Confirm flame appearance guidance against your text.'),
  status: 'draft',
});

const limitSwitch = defineQuestion({
  ...T,
  id: 'hvac.8.2.high-limit-trip',
  objective: '8.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A furnace runs, gets hot, then shuts the burners off while the blower keeps running. It ' +
    'restarts a few minutes later.\n\nWhat is happening?',
  choices: [
    'The high limit is tripping on excessive heat exchanger temperature — almost always an airflow problem',
    'The flame sensor is dirty',
    'The gas valve is failing',
    'The thermostat is satisfied and cycling normally',
  ],
  answer: 0,
  explain:
    'The blower continuing to run while the burners stop is the signature. The limit switch has ' +
    'opened the gas but left the blower going to cool the exchanger — exactly what it is designed ' +
    'to do.\n\n' +
    'The exchanger overheated because not enough air is carrying the heat away. Check the filter ' +
    'first, then the blower wheel, the blower speed tap, closed registers and duct restriction.\n\n' +
    'A dirty flame sensor gives a different pattern — the burners drop out within seconds of ' +
    'lighting, before anything gets hot. The timing distinguishes them.',
  source: cite.todo('Confirm the limit switch discussion against your text.'),
  status: 'draft',
});

const twoStageFurnace = defineQuestion({
  ...T,
  id: 'hvac.8.2.two-stage-benefit',
  objective: '8.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What is the advantage of a two-stage gas furnace over a single-stage one?',
  choices: [
    'It runs longer at lower fire on mild days, giving steadier temperatures and better efficiency',
    'It produces more heat overall',
    'It needs no venting',
    'It eliminates the need for a filter',
  ],
  answer: 0,
  explain:
    'A single-stage furnace is either full output or off. On a mild day it satisfies the thermostat ' +
    'quickly, shuts off, and the house drifts until it fires again — big temperature swings and ' +
    'lots of cycling.\n\n' +
    'Two-stage runs at roughly 60–70% on low fire for most of the season, so run times are longer ' +
    'and steadier. That improves comfort, cuts cycling losses, and moves air more consistently.\n\n' +
    'Modulating furnaces take the same idea further, varying output continuously.',
  source: cite.todo('Confirm the staging discussion against your text.'),
  status: 'draft',
});

const inducerVsAtmospheric = defineQuestion({
  ...T,
  id: 'hvac.8.5.why-inducer',
  objective: '8.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'What does an induced draft blower do that a natural draft furnace relies on buoyancy for?',
  choices: [
    'It pulls flue products through the exchanger and out the vent, so draft does not depend on stack effect',
    'It supplies combustion air to the burner',
    'It cools the heat exchanger',
    'It circulates air into the house',
  ],
  answer: 0,
  explain:
    'A natural draft appliance depends on hot flue gas being buoyant enough to rise up a chimney. ' +
    'That works, but it is at the mercy of stack temperature, chimney condition and what the rest ' +
    'of the house is doing to pressure.\n\n' +
    'An inducer takes that out of the equation — it mechanically pulls the products through. That ' +
    'is what allows a more restrictive, more efficient heat exchanger, and what makes the pressure ' +
    'switch possible as a proof of draft.\n\n' +
    'It is a different fan from the indoor blower, which moves house air, and from any combustion ' +
    'air fan.',
  source: cite.todo('Confirm the draft discussion against your text.'),
  status: 'draft',
});

const condensateNeutraliser = defineQuestion({
  ...T,
  id: 'hvac.8.4.condensate-acidity',
  objective: '8.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does condensing furnace condensate sometimes need a neutraliser before it goes to drain?',
  choices: [
    'It is mildly acidic and can attack metal drain piping and some municipal systems',
    'It contains carbon monoxide',
    'It is too hot for plastic drain pipe',
    'It would freeze in the drain',
  ],
  answer: 0,
  explain:
    'Flue gas condensate is typically around pH 3 to 5 — acidic enough to corrode cast iron or ' +
    'steel drain piping over time.\n\n' +
    'A neutraliser is a cartridge of limestone or marble chips the condensate flows through, ' +
    'raising the pH before discharge. Whether one is required depends on local code and the drain ' +
    'material.\n\n' +
    'The media is consumed and needs periodic replacement, which is a maintenance item people ' +
    'routinely forget until the drain line fails.',
  source: cite.todo('Confirm condensate handling requirements against your text and local code.'),
  status: 'draft',
});

const boilerLowWater = defineQuestion({
  ...T,
  id: 'hvac.8.6.low-water-cutoff',
  objective: '8.6',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does a low water cutoff on a boiler do, and why does it matter so much?',
  choices: [
    'Shuts off the burner if water level drops — firing a dry boiler can crack it or cause a violent failure',
    'Adds makeup water automatically',
    'Prevents the circulator from running dry',
    'Limits the maximum water temperature',
  ],
  answer: 0,
  explain:
    'A boiler heats water. Remove the water and the burner is heating bare metal, which cracks the ' +
    'vessel — and if water then reaches that superheated metal, it flashes to steam instantly. ' +
    'That failure mode is genuinely violent.\n\n' +
    'The low water cutoff is a life-safety device, not a convenience. It must be tested on a ' +
    'schedule, and it must never be bypassed.\n\n' +
    'Repeated low-water events point at a leak or a failed makeup arrangement, and that is the ' +
    'problem to solve rather than the cutoff that keeps tripping.',
  source: cite.todo('Confirm boiler safety controls against your text and applicable code.'),
  status: 'draft',
});

const hydronicDeltaT = defineQuestion({
  ...T,
  id: 'hvac.8.6.hydronic-delta-t',
  objective: '8.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A hydronic loop designed for a 20°F temperature difference is measuring 8°F.\n\n' +
    'What does that indicate?',
  choices: [
    'Flow is too high — the water is moving through too fast to give up its heat',
    'The boiler is undersized',
    'Flow is too low',
    'The system is operating correctly',
  ],
  answer: 0,
  explain:
    'From Q = 500 × GPM × ΔT: for a given heat output, flow and temperature difference trade off ' +
    'against each other. A small ΔT with the same output means high flow.\n\n' +
    'Over-pumping wastes electricity, can cause erosion and noise, and gives poorer heat transfer ' +
    'at the emitters.\n\n' +
    'The opposite — a large ΔT, say 35°F — means flow is too low, and parts of the system may not ' +
    'be getting heat at all. Either way the ΔT is telling you about flow, which is exactly why it ' +
    'is the first hydronic measurement to take.',
  source: cite.todo('Confirm hydronic balancing guidance against your text.'),
  status: 'draft',
});

const heatStripStaging = defineQuestion({
  ...T,
  id: 'hvac.8.7.strip-airflow-interlock',
  objective: '8.7',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why must electric heat strips be interlocked with the blower?',
  choices: [
    'Energised strips with no airflow overheat, trip their limits, and can start a fire',
    'To prevent the strips drawing too much current',
    'To keep the strips from corroding',
    'To satisfy the thermostat faster',
  ],
  answer: 0,
  explain:
    'A resistance element with air moving over it stays at a manageable temperature. Without ' +
    'airflow it keeps heating, glows, and the surrounding cabinet and ductwork get far hotter than ' +
    'they were designed for.\n\n' +
    'The interlock — plus thermal limits and fusible links as backup — is what prevents that. It is ' +
    'why the sequencer typically keeps the blower running after the strips de-energise, to carry ' +
    'the residual heat away.\n\n' +
    'A blower that fails while strips are energised is precisely the scenario those limits exist ' +
    'for, and it is why they must never be bypassed.',
  source: cite.todo('Confirm electric heat safety controls against your text.'),
  status: 'draft',
});

export const SECTOR_8_EXTRA: readonly Question[] = [
  excessAir,
  flameAppearance,
  limitSwitch,
  twoStageFurnace,
  inducerVsAtmospheric,
  condensateNeutraliser,
  boilerLowWater,
  hydronicDeltaT,
  heatStripStaging,
];
