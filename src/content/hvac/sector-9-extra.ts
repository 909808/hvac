import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 9 — additional questions. Continuation of `sector-9-heatpumps.ts`. */

const T = { track: 'hvac', domain: '9.0' } as const;

const copVsSeer = defineQuestion({
  ...T,
  id: 'hvac.9.4.cop',
  objective: '9.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A heat pump has a coefficient of performance of 3.0 at a given outdoor temperature.\n\n' +
    'What does that mean?',
  choices: [
    'It delivers three units of heat for every unit of electrical energy it consumes',
    'It is 300% efficient at converting electricity to heat',
    'It runs three times longer than a furnace',
    'Its output is three times its rated capacity',
  ],
  answer: 0,
  whyWrong: {
    1: 'Nothing converts energy at over 100%. The heat pump moves existing heat rather than creating it.',
    2: 'COP says nothing about run time.',
    3: 'COP is an efficiency ratio, not a capacity multiplier.',
  },
  explain:
    'COP is heat delivered divided by energy consumed, both in the same units. A COP of 3.0 means ' +
    'three units out for one in.\n\n' +
    'That is not a violation of anything — the extra two units were already in the outdoor air, ' +
    'and the electricity paid for **moving** them rather than creating them. Electric resistance ' +
    'heat has a COP of exactly 1.0.\n\n' +
    'COP falls as it gets colder, because there is less temperature difference to work with. That ' +
    'declining curve is what produces the balance point.',
  source: cite.standard('COP = heat delivered ÷ energy consumed'),
  status: 'verified',
});

const defrostInitiationTypes = defineQuestion({
  ...T,
  id: 'hvac.9.2.defrost-initiation',
  objective: '9.2',
  kind: 'match',
  difficulty: 3,
  prompt: 'Match each defrost control strategy to how it decides to start.',
  pairs: [
    ['Time and temperature', 'Fixed run-time interval, plus a coil temperature check'],
    ['Demand defrost', 'Measures actual coil conditions and defrosts only when frost is present'],
    ['Pressure differential', 'Senses air pressure drop across the coil as frost blocks it'],
  ],
  explain:
    'Time-and-temperature is the older approach: every 30, 60 or 90 minutes of compressor run time, ' +
    'check whether the coil is cold enough to warrant defrosting. Simple, and it defrosts when it ' +
    'does not need to.\n\n' +
    'Demand defrost compares coil temperature against ambient — the gap widens as frost builds — ' +
    'and only runs a cycle when the readings say frost is actually there. Fewer cycles, better ' +
    'efficiency, less auxiliary heat.\n\n' +
    'Every unnecessary defrost costs a reversal, a period of cooling the house, and a run of ' +
    'resistance heat. That is why the difference shows up on a power bill.',
  source: cite.todo('Confirm defrost control types against your text and manufacturer literature.'),
  status: 'draft',
});

const outdoorCoilIced = defineQuestion({
  ...T,
  id: 'hvac.9.2.solid-ice-outdoor',
  objective: '9.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A heat pump outdoor coil is encased in solid ice, not light frost.\n\nWhat does that suggest?',
  choices: [
    'Defrost is not working — a failed sensor, board or reversing valve, or a blocked base pan drain',
    'Normal operation in cold weather',
    'The system is overcharged',
    'The indoor filter is dirty',
  ],
  answer: 0,
  explain:
    'Light frost between defrost cycles is normal. A solid block means the cycle is not running, ' +
    'not completing, or the melt water is not getting away.\n\n' +
    'Check in this order: is the board calling for defrost at all, does the reversing valve ' +
    'actually shift, does the outdoor fan stop, and is the base pan drain clear. A blocked drain ' +
    'refreezes the melt water at the bottom of the coil and builds up over days.\n\n' +
    'Running like that is destructive — the coil cannot absorb heat, suction pressure collapses, ' +
    'and the compressor suffers.',
  source: cite.todo('Confirm the defrost failure diagnosis against your service text.'),
  status: 'draft',
});

const dualFuel = defineQuestion({
  ...T,
  id: 'hvac.9.3.dual-fuel',
  objective: '9.3',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What is a dual-fuel (hybrid) system, and what decides which heat source runs?',
  choices: [
    'A heat pump paired with a gas furnace, switching at an outdoor temperature where gas becomes cheaper or the heat pump runs out',
    'A furnace that can burn both natural gas and propane',
    'A heat pump with two compressors',
    'A system with both electric strips and a heat pump',
  ],
  answer: 0,
  explain:
    'The heat pump handles mild weather, where its COP makes it the cheaper source. Below a ' +
    'changeover temperature the furnace takes over entirely — the compressor locks out.\n\n' +
    'Where to set the changeover is an economic calculation as much as a capacity one: it depends ' +
    'on local electricity and gas prices, and on where the heat pump\'s capacity falls off.\n\n' +
    'Note the difference from a heat pump with electric strips, where aux **supplements** the ' +
    'running compressor. In dual fuel they do not run together — the furnace replaces the heat pump ' +
    'rather than helping it.',
  source: cite.todo('Confirm the dual fuel discussion against your text.'),
  status: 'draft',
});

const heatPumpSuctionLine = defineQuestion({
  ...T,
  id: 'hvac.9.5.line-naming',
  objective: '9.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'On a heat pump, why are the two refrigerant lines called the "vapour line" and "liquid line" ' +
    'rather than "suction" and "discharge"?',
  choices: [
    'Because the reversing valve swaps their roles, so a line that carries suction gas in cooling carries hot discharge gas in heating',
    'Because heat pumps use different tubing materials',
    'Because both lines carry vapour at all times',
    'It is an arbitrary manufacturer convention',
  ],
  answer: 0,
  explain:
    'In cooling, the large line carries cool suction vapour from the indoor coil. In heating, that ' +
    'same line carries hot discharge gas *to* the indoor coil.\n\n' +
    'Calling it "the suction line" would be wrong half the time, so the naming describes the state ' +
    'of the refrigerant — vapour versus liquid — which stays true in both modes.\n\n' +
    'It matters practically: that line gets genuinely hot in heating mode, and insulation and ' +
    'clearances have to account for it.',
  source: cite.todo('Confirm heat pump line naming against your text.'),
  status: 'draft',
});

const emergencyHeatDiagnostic = defineQuestion({
  ...T,
  id: 'hvac.9.3.emergency-heat-test',
  objective: '9.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A customer says their heat pump is not heating. Switching the thermostat to emergency heat ' +
    'produces warm air.\n\nWhat has that told you?',
  choices: [
    'The strips and blower work — the fault is in the heat pump side: compressor, charge, reversing valve or defrost',
    'The thermostat is faulty',
    'The problem is with the ductwork',
    'Nothing useful',
  ],
  answer: 0,
  explain:
    'Emergency heat locks the compressor off and heats with the strips alone. If that works, then ' +
    'the blower, the strips, the thermostat wiring for W and G, and the indoor unit are all fine.\n\n' +
    'Everything that remains is on the heat pump side: the compressor, the charge, the reversing ' +
    'valve, or the defrost control.\n\n' +
    'It is a thirty-second test that cuts the problem space in half, and it is one of the few ' +
    'diagnostics you can talk a customer through over the phone.',
  source: cite.todo('Confirm the emergency heat test against your service text.'),
  status: 'draft',
});

const heatPumpSizing = defineQuestion({
  ...T,
  id: 'hvac.9.4.sizing-tradeoff',
  objective: '9.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why is a heat pump not simply sized large enough to meet the heating load at the coldest ' +
    'design temperature?',
  choices: [
    'It would be badly oversized for cooling, short-cycling all summer and leaving the house humid',
    'Larger heat pumps are not manufactured',
    'The electrical service could not support it',
    'It would never reach its balance point',
  ],
  answer: 0,
  explain:
    'A heat pump does both jobs with one piece of equipment, and the two loads do not match. Size ' +
    'it for the coldest night and it is far too big for the cooling season.\n\n' +
    'An oversized cooling system short-cycles: it satisfies the thermostat quickly, shuts off before ' +
    'the coil has removed much moisture, and leaves the house cool and clammy.\n\n' +
    'So it is sized for the cooling load, and auxiliary heat covers the shortfall below the balance ' +
    'point. Variable-capacity equipment softens this trade considerably, which is much of why it ' +
    'has taken over in colder climates.',
  source: cite.todo('Confirm heat pump sizing guidance against your text or ACCA Manual J/S.'),
  status: 'draft',
});

export const SECTOR_9_EXTRA: readonly Question[] = [
  copVsSeer,
  defrostInitiationTypes,
  outdoorCoilIced,
  dualFuel,
  heatPumpSuctionLine,
  emergencyHeatDiagnostic,
  heatPumpSizing,
];
