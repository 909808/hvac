import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/** Sector 9 — Heat Pumps. */

const T = { track: 'hvac', domain: '9.0' } as const;

const heatingModeDiagram: Topology = {
  caption: 'Heat pump in heating mode — the outdoor coil is now the evaporator',
  nodes: [
    { id: 'comp', kind: 'compressor', label: 'Compressor', col: 0, row: 1 },
    { id: 'rv', kind: 'metering', label: 'Reversing valve', sublabel: 'energised or not', col: 1, row: 1 },
    { id: 'indoor', kind: 'condenser', label: 'Indoor coil', sublabel: 'CONDENSER in heating', col: 2, row: 0 },
    { id: 'outdoor', kind: 'evaporator', label: 'Outdoor coil', sublabel: 'EVAPORATOR in heating', col: 2, row: 2 },
    { id: 'meter', kind: 'metering', label: 'Metering', col: 3, row: 1 },
  ],
  links: [
    { from: 'comp', to: 'rv' },
    { from: 'rv', to: 'indoor', label: 'hot gas' },
    { from: 'indoor', to: 'meter' },
    { from: 'meter', to: 'outdoor' },
    { from: 'outdoor', to: 'rv', label: 'cool vapour' },
  ],
};

// --- 9.1 The reversing valve ---------------------------------------------------

const coilRoles = defineQuestion({
  ...T,
  id: 'hvac.9.1.coil-roles',
  objective: '9.1',
  kind: 'choice',
  difficulty: 2,
  topology: heatingModeDiagram,
  prompt: 'In heating mode, what role does each coil play?',
  choices: [
    'The indoor coil is the condenser and the outdoor coil is the evaporator',
    'The indoor coil is the evaporator and the outdoor coil is the condenser',
    'Both coils act as condensers',
    'The roles depend on outdoor temperature rather than on mode',
  ],
  answer: 0,
  explain:
    'The reversing valve swaps which coil receives hot discharge gas. In heating, the indoor coil ' +
    'gets it and condenses — rejecting heat into the house — while the outdoor coil boils ' +
    'refrigerant, absorbing heat from outdoor air.\n\n' +
    'It sounds implausible that a 30°F outdoor coil absorbs heat from 30°F air, but heat only has ' +
    'to move from warmer to cooler: with the refrigerant boiling at perhaps 15°F, outdoor air at ' +
    '30°F is a heat source. Capacity falls as it gets colder because that temperature difference ' +
    'shrinks.\n\n' +
    'The terms "evaporator" and "condenser" describe what a coil is doing at that moment, not ' +
    'where it is mounted — which is why heat pump literature often says "indoor coil" and ' +
    '"outdoor coil" instead.',
  source: cite.todo('Confirm the heating mode description against your text.'),
  status: 'draft',
});

const reversingValveFailure = defineQuestion({
  ...T,
  id: 'hvac.9.1.valve-energised',
  objective: '9.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A heat pump with an O-terminal reversing valve blows cold air when the thermostat calls for ' +
    'heat, and warm air when it calls for cooling.\n\nWhat should you check first?',
  choices: [
    'Whether the thermostat is configured for O rather than B, and whether O is energised in the wrong mode',
    'The refrigerant charge',
    'The outdoor fan motor',
    'The defrost board timer setting',
  ],
  answer: 0,
  explain:
    'The modes are exactly inverted, which points at the reversing valve control rather than ' +
    'anything in the refrigerant circuit — a charge or airflow problem degrades performance, it ' +
    'does not swap heating and cooling.\n\n' +
    'O energises the valve in cooling; B energises it in heating. A thermostat configured for the ' +
    'wrong one gives precisely this symptom. It is a configuration setting on most modern ' +
    'thermostats and a very common error after a replacement.\n\n' +
    'If the configuration is right, then either the valve solenoid is being energised incorrectly ' +
    'by the board, or the valve itself is stuck. Feeling the pipe temperatures at the valve body ' +
    'while switching modes tells you which.',
  source: cite.todo('Confirm the O/B convention against your text and the thermostat documentation.'),
  status: 'draft',
});

// --- 9.2 Defrost ---------------------------------------------------------------

const defrostCycle = defineQuestion({
  ...T,
  id: 'hvac.9.2.defrost-mechanism',
  objective: '9.2',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What actually happens during a heat pump defrost cycle?',
  choices: [
    'The unit switches to cooling, the outdoor fan stops, and auxiliary heat runs to temper the indoor air',
    'An electric heater on the outdoor coil melts the frost',
    'The compressor stops and the outdoor fan runs to blow the frost off',
    'The indoor blower reverses to push warm air outside',
  ],
  answer: 0,
  explain:
    'Defrost uses the system itself. Switching to cooling sends hot discharge gas to the outdoor ' +
    'coil, which melts the frost from the inside out. The outdoor fan stops so that cold air is ' +
    'not blowing across the coil it is trying to warm.\n\n' +
    'The catch is that the indoor coil is now absorbing heat, so it is cooling the house. That is ' +
    'why auxiliary heat is energised during defrost — to temper the supply air so the occupants do ' +
    'not feel a blast of cold.\n\n' +
    'Steam rising off the outdoor unit in winter is normal defrost, not a fault. The complaint ' +
    'worth investigating is a unit defrosting far too often, or one that never does and ices ' +
    'solid.',
  source: cite.todo('Confirm the defrost sequence against your text and the equipment literature.'),
  status: 'draft',
});

const defrostTermination = defineQuestion({
  ...T,
  id: 'hvac.9.2.termination',
  objective: '9.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A demand-defrost heat pump initiates defrost on measured coil conditions. What normally ' +
    'terminates the cycle?',
  choices: [
    'A coil temperature sensor reaching its termination setpoint, with a maximum time as a backup',
    'A fixed ten-minute timer in every case',
    'The indoor thermostat being satisfied',
    'The outdoor ambient rising above freezing',
  ],
  answer: 0,
  explain:
    'Termination is on temperature, because that is what actually indicates the frost has gone. ' +
    'The timer is a backup limit that stops a stuck cycle running indefinitely, not the normal ' +
    'means of ending it.\n\n' +
    'This is the distinction between demand defrost and older time-and-temperature controls, which ' +
    'defrosted every 30, 60 or 90 minutes of run time whether or not there was frost. Demand ' +
    'defrost only runs when conditions warrant, which saves the efficiency penalty of unnecessary ' +
    'cycles.\n\n' +
    'A system terminating on time rather than temperature every cycle is a symptom worth chasing ' +
    '— usually a failed or mislocated coil sensor.',
  source: cite.todo('Confirm the defrost termination logic against the equipment manufacturer literature.'),
  status: 'draft',
});

// --- 9.3 Auxiliary heat ----------------------------------------------------------

const auxVsEmergency = defineQuestion({
  ...T,
  id: 'hvac.9.3.aux-vs-emergency',
  objective: '9.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What is the difference between auxiliary heat and emergency heat?',
  choices: [
    'Auxiliary heat supplements the running heat pump; emergency heat replaces it entirely with the compressor off',
    'They are two names for the same thing',
    'Auxiliary heat is electric; emergency heat is gas',
    'Auxiliary heat runs in summer; emergency heat runs in winter',
  ],
  answer: 0,
  explain:
    'Auxiliary heat comes on alongside the heat pump when the heat pump alone cannot keep up — the ' +
    'compressor keeps running and the strips make up the shortfall. That is normal operation on a ' +
    'cold day.\n\n' +
    'Emergency heat is a manual selection that locks the compressor off and heats entirely with ' +
    'the strips. It is for when the heat pump has failed, and it is expensive to run because ' +
    'resistance heat costs two to four times what the heat pump would.\n\n' +
    'A customer who left the thermostat in emergency heat all winter and then complains about the ' +
    'bill is a genuinely common call. So is a system running aux far more than it should, which ' +
    'usually points at a heat pump that is not producing its rated capacity.',
  source: cite.todo('Confirm the aux/emergency distinction against your text.'),
  status: 'draft',
});

// --- 9.4 Balance point -----------------------------------------------------------

const balancePoint = defineQuestion({
  ...T,
  id: 'hvac.9.4.balance-point',
  objective: '9.4',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What is the balance point of a heat pump installation?',
  choices: [
    'The outdoor temperature at which the heat pump\'s capacity exactly equals the building\'s heat loss',
    'The temperature at which heating and cooling costs are equal',
    'The point at which the reversing valve switches',
    'The outdoor temperature at which defrost begins',
  ],
  answer: 0,
  explain:
    'Two lines cross at the balance point. Building heat loss rises as it gets colder outside; ' +
    'heat pump capacity falls, because the outdoor coil has less temperature difference to work ' +
    'with. Where they meet, the heat pump exactly meets the load.\n\n' +
    'Below that temperature the heat pump cannot keep up on its own and auxiliary heat has to make ' +
    'up the difference. Above it, the heat pump alone is enough and any aux operation is waste.\n\n' +
    'A typical residential balance point falls somewhere around 30–35°F, though it depends ' +
    'entirely on the building and the equipment. Knowing it is what lets you judge whether the aux ' +
    'heat you are seeing is normal for the weather or a symptom.',
  source: cite.todo('Confirm the balance point discussion against your text.'),
  status: 'draft',
});

// --- 9.5 Checking a heat pump -----------------------------------------------------

const heatingModeCharge = defineQuestion({
  ...T,
  id: 'hvac.9.5.charging-in-heating',
  objective: '9.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why is charging a heat pump in heating mode unreliable, and what is the usual guidance?',
  choices: [
    'Charge in cooling mode where the charts apply, or weigh in the charge; heating-mode readings vary too much with outdoor conditions',
    'Heating mode charging is preferred, because the readings are more stable',
    'Charge is irrelevant to a heat pump because the refrigerant reverses direction',
    'Only subcooling can be measured in heating mode',
  ],
  answer: 0,
  explain:
    'In heating mode the outdoor coil is the evaporator, and its performance swings with outdoor ' +
    'temperature and humidity, frost accumulation and where the unit sits in its defrost cycle. ' +
    'The readings move around too much to charge against reliably.\n\n' +
    'The usual approaches are to charge in cooling mode where the manufacturer\'s charts apply, or ' +
    'to recover, evacuate and weigh in the nameplate charge with the line-set adjustment — which ' +
    'is accurate regardless of the weather and is the right answer in winter.\n\n' +
    'Always check the manufacturer instructions. Some units have a specific heating-mode charging ' +
    'procedure with its own chart, and where one exists it takes precedence over the general rule.',
  source: cite.todo('Confirm heat pump charging guidance against your text and the equipment literature.'),
  status: 'draft',
});

export const SECTOR_9_QUESTIONS: readonly Question[] = [
  coilRoles,
  reversingValveFailure,
  defrostCycle,
  defrostTermination,
  auxVsEmergency,
  balancePoint,
  heatingModeCharge,
];
