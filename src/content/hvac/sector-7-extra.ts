import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 7 — additional questions. Continuation of `sector-7-psychrometrics.ts`. */

const T = { track: 'hvac', domain: '7.0' } as const;

const grainsConversion = defineQuestion({
  ...T,
  id: 'hvac.7.1.grains-per-pound',
  objective: '7.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'There are 7,000 grains in a pound. Why does the trade use grains rather than pounds of water?',
  choices: [
    'The quantities are tiny — typical indoor air holds around 60 to 80 grains per pound of dry air',
    'Grains are the SI unit for moisture',
    'Pounds of water cannot be measured directly',
    'It is a historical convention with no practical reason',
  ],
  answer: 0,
  explain:
    'Air at 75°F and 50% RH holds about 0.0092 lb of water per pound of dry air. Writing that as ' +
    '64 grains is simply easier to read, compare and do arithmetic with.\n\n' +
    'It also matches the latent heat formula: Ql = 0.68 × CFM × Δgrains. The constant already ' +
    'assumes grains.\n\n' +
    'When you see humidity ratio written as 0.0092 lb/lb in a textbook and 64 gr/lb on an ' +
    'instrument, they are the same number.',
  source: cite.standard('7,000 grains = 1 pound'),
  status: 'verified',
});

const specificVolume = defineQuestion({
  ...T,
  id: 'hvac.7.1.specific-volume',
  objective: '7.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Specific volume of air at typical indoor conditions is about 13.5 ft³ per pound. Why does it matter?',
  choices: [
    'It converts between volume airflow in CFM and mass airflow, which is what actually carries heat',
    'It determines the duct size directly',
    'It sets the coil temperature',
    'It is only relevant at altitude',
  ],
  answer: 0,
  explain:
    'Heat is carried by mass, not volume. A cubic foot of hot attic air weighs less than a cubic ' +
    'foot of cool basement air, and carries proportionally less heat.\n\n' +
    'Specific volume is the bridge: pounds per minute = CFM ÷ specific volume. It is buried inside ' +
    'the 1.08 constant, which assumes standard air at 0.075 lb/ft³ — the reciprocal of 13.33 ft³/lb.\n\n' +
    'It is exactly why the constant shrinks at altitude: thinner air, higher specific volume, less ' +
    'mass per CFM, less heat moved.',
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1'),
  status: 'verified',
});

const apparatusDewPoint = defineQuestion({
  ...T,
  id: 'hvac.7.2.apparatus-dew-point',
  objective: '7.2',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What is a coil\'s apparatus dew point?',
  choices: [
    'The effective surface temperature the coil behaves as if it had — where its process line meets saturation',
    'The dew point of the air entering the coil',
    'The temperature at which the condensate drain freezes',
    'The dew point of the air leaving the coil',
  ],
  answer: 0,
  explain:
    'A real coil does not have one temperature — it varies along its length and depth. The ' +
    'apparatus dew point is the single effective temperature that would produce the same result: ' +
    'extend the coil\'s process line on the chart and see where it hits the saturation curve.\n\n' +
    'It matters because it determines how much moisture the coil can remove. A lower apparatus dew ' +
    'point means more dehumidification.\n\n' +
    'Airflow moves it directly: less air, colder coil, lower apparatus dew point, more latent ' +
    'removal. That is the mechanism behind the humid-house fix.',
  source: cite.todo('Confirm the apparatus dew point discussion against your text or ASHRAE Fundamentals.'),
  status: 'draft',
});

const bypassFactor = defineQuestion({
  ...T,
  id: 'hvac.7.2.bypass-factor',
  objective: '7.2',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does a coil\'s bypass factor describe?',
  choices: [
    'The fraction of air that passes through without contacting the cold surface, so leaves unchanged',
    'Air that leaks around the coil frame',
    'Refrigerant bypassing the metering device',
    'The share of capacity lost to duct leakage',
  ],
  answer: 0,
  explain:
    'Not every molecule touches a fin. Some air threads through and comes out at entering ' +
    'conditions, then mixes with the air that was fully conditioned.\n\n' +
    'The bypass factor is that fraction. A deeper coil with more rows and tighter fins has a lower ' +
    'bypass factor and gets closer to its apparatus dew point.\n\n' +
    'It also explains why supply air is not saturated even though parts of the coil are below the ' +
    'dew point: what leaves the coil is a mixture of fully conditioned and untouched air.',
  source: cite.todo('Confirm the bypass factor discussion against your text.'),
  status: 'draft',
});

const latentCalc = defineQuestion({
  ...T,
  id: 'hvac.7.3.latent-calc',
  objective: '7.3',
  kind: 'input',
  difficulty: 2,
  prompt:
    '1,000 CFM of air is dehumidified by 22 grains per pound.\n\n' +
    'How much latent heat is being removed, in BTU/h?',
  placeholder: 'BTU/h',
  accept: ['14960'],
  tolerance: 300,
  explain:
    'Ql = 0.68 × CFM × Δgrains = 0.68 × 1,000 × 22 = **14,960 BTU/h**.\n\n' +
    'That is over a ton of capacity spent on moisture alone, and none of it shows on a thermometer.\n\n' +
    'It is also why a system in a humid climate needs more total capacity than the sensible load ' +
    'alone suggests — and why sizing on sensible load in Florida leaves you short.',
  source: cite.standard('Ql = 0.68 × CFM × Δgrains'),
  status: 'verified',
});

const shrCalc = defineQuestion({
  ...T,
  id: 'hvac.7.4.shr-calc',
  objective: '7.4',
  kind: 'input',
  difficulty: 2,
  prompt:
    'A coil produces 30,000 BTU/h total and 21,000 BTU/h sensible.\n\n' +
    'What is the sensible heat ratio? Give it as a decimal.',
  placeholder: 'e.g. 0.75',
  accept: ['0.7'],
  tolerance: 0.03,
  explain:
    'SHR = sensible ÷ total = 21,000 ÷ 30,000 = **0.70**.\n\n' +
    'That is a fairly low SHR, meaning 30% of the capacity is doing moisture removal. Appropriate ' +
    'for a humid climate.\n\n' +
    'Typical residential equipment runs 0.70 to 0.80. Above 0.85 the system is doing very little ' +
    'dehumidification, which is right in Phoenix and a comfort complaint in Houston.',
  source: cite.standard('SHR = Qs ÷ Qt'),
  status: 'verified',
});

const dehumidifierVsAc = defineQuestion({
  ...T,
  id: 'hvac.7.5.standalone-dehumidifier',
  objective: '7.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does a standalone dehumidifier warm the room it is in, while an air conditioner cools it?',
  choices: [
    'A dehumidifier rejects its condenser heat into the same room, plus the latent heat it removed',
    'Dehumidifiers use resistance heat to dry the air',
    'The compressor runs hotter in a dehumidifier',
    'It does not; a dehumidifier cools the room slightly',
  ],
  answer: 0,
  explain:
    'Both machines run the same cycle. The difference is where the condenser sends its heat.\n\n' +
    'An air conditioner puts the evaporator indoors and the condenser outdoors — heat leaves the ' +
    'house. A dehumidifier has both in the same room, so all the heat it absorbs comes straight ' +
    'back out, **plus** the compressor\'s own work as extra heat.\n\n' +
    'The room ends up drier and slightly warmer. That is not a flaw, it is what the machine is for ' +
    '— but it explains why running one in an already-hot room feels counterproductive.',
  source: cite.todo('Confirm the dehumidifier discussion against your text.'),
  status: 'draft',
});

const ervVsHrv = defineQuestion({
  ...T,
  id: 'hvac.7.5.erv-vs-hrv',
  objective: '7.5',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What distinguishes an ERV from an HRV?',
  choices: [
    'An ERV transfers moisture as well as heat between the airstreams; an HRV transfers heat only',
    'An ERV uses a fan and an HRV does not',
    'An HRV works in summer and an ERV in winter',
    'They are the same device',
  ],
  answer: 0,
  explain:
    'Both recover energy from exhaust air to pre-condition incoming ventilation air. The difference ' +
    'is whether moisture crosses too.\n\n' +
    'An **HRV** moves sensible heat only. Right for a cold dry climate where you want to keep heat ' +
    'but not humidity.\n\n' +
    'An **ERV** also transfers moisture. In a humid climate that means incoming outdoor air gives ' +
    'up some of its moisture to the outgoing stream before reaching the coil, which cuts the ' +
    'ventilation latent load substantially.\n\n' +
    'Climate decides which. Getting it backwards means either a humidity problem or unnecessarily ' +
    'dry winter air.',
  source: cite.todo('Confirm the ERV/HRV comparison against your text or ASHRAE 62.'),
  status: 'draft',
});

export const SECTOR_7_EXTRA: readonly Question[] = [
  grainsConversion,
  specificVolume,
  apparatusDewPoint,
  bypassFactor,
  latentCalc,
  shrCalc,
  dehumidifierVsAc,
  ervVsHrv,
];
