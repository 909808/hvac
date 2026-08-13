import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 10 — additional questions. Continuation of `sector-10-diagnostics.ts`. */

const T = { track: 'hvac', domain: '10.0' } as const;

const changedRecently = defineQuestion({
  ...T,
  id: 'hvac.10.1.what-changed',
  objective: '10.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A system worked fine for six years and stopped last week. Nothing about the building changed.\n\n' +
    'What does that timeline tell you?',
  choices: [
    'Look for something that wears out or drifts — a capacitor, a contactor, a slow leak, a fouled coil',
    'The system was never sized correctly',
    'The ductwork must be undersized',
    'The refrigerant type is wrong',
  ],
  answer: 0,
  explain:
    'Six years of working correctly rules out design and installation faults. Undersized ducts do ' +
    'not start being undersized in year six.\n\n' +
    'What changes with time is condition: capacitors drift out of tolerance, contactor contacts ' +
    'burn, coils foul, refrigerant leaks slowly, bearings wear.\n\n' +
    'The opposite timeline points the other way — a system that has never worked properly since ' +
    'installation is a design or installation problem, and no amount of component replacement will ' +
    'fix it.',
  source: cite.todo('Confirm the diagnostic reasoning against your service text.'),
  status: 'draft',
});

const intermittentFault = defineQuestion({
  ...T,
  id: 'hvac.10.1.intermittent',
  objective: '10.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A fault only appears on the hottest afternoons and the system works fine when you visit in ' +
    'the morning.\n\nWhat approach fits?',
  choices: [
    'Look for something marginal that fails under load or heat — a weak capacitor, a dirty condenser, high head pressure',
    'Replace the compressor, since intermittent faults are always mechanical',
    'Tell the customer it is working correctly',
    'Wait for it to fail permanently',
  ],
  answer: 0,
  explain:
    'Load-dependent faults are marginal components pushed past their limit. Heat raises head ' +
    'pressure and amp draw, so anything already weak gives up at the worst moment.\n\n' +
    'Candidates: a capacitor that measures low but not failed, a condenser that is dirty enough to ' +
    'matter only at 100°F, a contactor with pitted contacts, a supply circuit with excessive ' +
    'voltage drop.\n\n' +
    'Measure what you can and judge against the bands rather than against "works or does not". A ' +
    'capacitor at 91% of rating is a finding even though the system is running while you stand ' +
    'there.',
  source: cite.todo('Confirm the intermittent fault approach against your service text.'),
  status: 'draft',
});

const readingSet = defineQuestion({
  ...T,
  id: 'hvac.10.2.minimum-reading-set',
  objective: '10.2',
  kind: 'multi',
  difficulty: 3,
  prompt:
    'Which readings are needed to calculate superheat, subcooling AND condenser split? Select all that apply.',
  choices: [
    'Suction pressure',
    'Suction line temperature',
    'Liquid pressure',
    'Liquid line temperature',
    'Outdoor ambient temperature',
    'Indoor wet bulb temperature',
    'Compressor running amps',
  ],
  answers: [0, 1, 2, 3, 4],
  explain:
    'Five readings, and they are efficient because one of them serves twice:\n\n' +
    '**Superheat** = suction line temp − sat(suction pressure)\n' +
    '**Subcooling** = sat(liquid pressure) − liquid line temp\n' +
    '**Condenser split** = sat(liquid pressure) − ambient\n\n' +
    'Indoor wet bulb is needed for a fixed-orifice charging **target**, and amps tell you about ' +
    'compressor work — both genuinely useful, but neither appears in any of these three ' +
    'calculations.\n\n' +
    'Add return and supply air temperature to the five and you have the air side too. Seven ' +
    'readings, and almost every cooling fault becomes distinguishable.',
  source: cite.standard('Superheat, subcooling and condenser split definitions'),
  status: 'verified',
});

const ampsMeaning = defineQuestion({
  ...T,
  id: 'hvac.10.2.amps-interpretation',
  objective: '10.2',
  kind: 'match',
  difficulty: 3,
  prompt: 'Match each compressor amp reading against RLA to what it suggests.',
  pairs: [
    ['Well below RLA', 'Not doing work — a failing compressor, or very low charge'],
    ['At or near RLA', 'Working hard — high head pressure, overcharge, or a hot day'],
    ['Above RLA', 'Overloaded — will trip on its protector; check head pressure and voltage'],
    ['Locked rotor current', 'Not turning at all — capacitor, seized compressor or start problem'],
  ],
  explain:
    'Amps measure how much work the compressor is doing, which is a genuinely different question ' +
    'from what the pressures say.\n\n' +
    'The reading that surprises people is **low** amps. It feels like good news and it usually is ' +
    'not — a compressor that is not pumping draws little current, and that is the signature that ' +
    'confirms the pressures-converging pattern.\n\n' +
    'Always compare against the RLA on the data plate, not against a remembered number. A 3-ton ' +
    'and a 5-ton draw very different currents when both are perfectly healthy.',
  source: cite.todo('Confirm the amp interpretation against your service text.'),
  status: 'draft',
});

const twoFaultsAtOnce = defineQuestion({
  ...T,
  id: 'hvac.10.3.two-faults',
  objective: '10.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You find a badly loaded filter AND subcooling at 4°F.\n\nHow should you proceed?',
  choices: [
    'Fix the airflow first, let it stabilise, then re-measure — airflow affects every other reading',
    'Add refrigerant to correct the subcooling, then change the filter',
    'Change the filter and leave, since airflow was clearly the problem',
    'Both readings cannot be right; re-measure',
  ],
  answer: 0,
  explain:
    'Systems can have more than one thing wrong, and the order you fix them in matters.\n\n' +
    'Airflow first, always. It affects evaporator temperature, suction pressure, superheat, ' +
    'subcooling and capacity. Measure the refrigerant side while airflow is wrong and you are ' +
    'measuring a system that does not exist once you fix the filter.\n\n' +
    'Change the filter, run it fifteen minutes, then take a fresh set of readings. The subcooling ' +
    'may still be low — in which case you now have a real charge finding, and a leak to look for.',
  source: cite.todo('Confirm the order-of-repair guidance against your service text.'),
  status: 'draft',
});

const capacityCheck = defineQuestion({
  ...T,
  id: 'hvac.10.3.measuring-capacity',
  objective: '10.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'How can you estimate what a system is actually delivering, rather than whether its readings look normal?',
  choices: [
    'Measure airflow and the enthalpy difference across the coil, then apply Qt = 4.5 × CFM × Δh',
    'Read the nameplate capacity',
    'Time how long it takes to drop the house one degree',
    'Compare suction pressure to a chart',
  ],
  answer: 0,
  explain:
    'Nameplate capacity is what it produced in a lab at rated conditions. What it is delivering ' +
    'today is a different number, and only a measurement gives it to you.\n\n' +
    'Take dry bulb and wet bulb entering and leaving the coil, look up or compute the enthalpy at ' +
    'each, and apply the total heat formula. Compare against nameplate corrected for the current ' +
    'conditions.\n\n' +
    'It is more work than reading gauges, which is why it is reserved for the calls where "the ' +
    'readings look fine but it will not cool the house" — exactly the situation where the gauges ' +
    'have run out of things to tell you.',
  source: cite.standard('Qt = 4.5 × CFM × Δh'),
  status: 'verified',
});

const whenToEscalate = defineQuestion({
  ...T,
  id: 'hvac.10.4.compressor-replacement-decision',
  objective: '10.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You have confirmed a failed compressor on a fourteen-year-old R-22 system.\n\n' +
    'What is the honest conversation to have?',
  choices: [
    'Present replacement of the system as the likely better value, with the compressor swap as an option, and let the customer decide',
    'Replace the compressor without discussion, since that is the failed part',
    'Refuse to repair it and insist on replacement',
    'Recommend the cheapest option regardless of circumstances',
  ],
  answer: 0,
  explain:
    'A compressor on a fourteen-year-old R-22 system is a genuine judgement call. The repair is ' +
    'expensive, R-22 is costly and only available reclaimed, the rest of the system has aged the ' +
    'same fourteen years, and a new system would be substantially more efficient.\n\n' +
    'But it is the customer\'s money and the customer\'s decision. Sometimes the repair is right — ' +
    'they are selling the house, or cannot fund a replacement this month.\n\n' +
    'Give them the real numbers and the real trade-offs. Deciding for them, in either direction, is ' +
    'how trust gets lost.',
  source: cite.todo('Confirm the repair-vs-replace discussion against your service text.'),
  status: 'draft',
});

const documentWhatYouDid = defineQuestion({
  ...T,
  id: 'hvac.10.5.what-to-record',
  objective: '10.5',
  kind: 'multi',
  difficulty: 2,
  prompt: 'What belongs on a service ticket? Select all that apply.',
  choices: [
    'The readings you took, with the conditions they were taken under',
    'What you found and what you did about it',
    'Any deficiency you noticed but did not repair',
    'Your opinion of the previous technician',
  ],
  answers: [0, 1, 2],
  explain:
    'Readings without conditions are nearly useless — 45°F suction means one thing at 75°F indoor ' +
    'and another at 85°F. Record ambient and indoor conditions alongside.\n\n' +
    'Noting deficiencies you did **not** repair matters twice over: it gives the customer the ' +
    'information to decide, and it protects you when the thing you flagged eventually fails.\n\n' +
    'Commentary on whoever was there before helps nobody, and it tends to reach the customer.',
  source: cite.todo('Confirm documentation practice against your service text.'),
  status: 'draft',
});

export const SECTOR_10_EXTRA: readonly Question[] = [
  changedRecently,
  intermittentFault,
  readingSet,
  ampsMeaning,
  twoFaultsAtOnce,
  capacityCheck,
  whenToEscalate,
  documentWhatYouDid,
];
