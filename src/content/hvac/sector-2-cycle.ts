import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/**
 * Sector 2 — The Refrigeration Cycle.
 *
 * The loop everything else hangs off. Ends with superheat and subcooling, which
 * are the only two numbers that tell you what is happening inside a sealed
 * system you cannot see into.
 */

const T = { track: 'hvac', domain: '2.0' } as const;

const cycleDiagram: Topology = {
  caption: 'Split system in cooling — follow the refrigerant clockwise from the compressor',
  nodes: [
    { id: 'comp', kind: 'compressor', label: 'Compressor', sublabel: 'low P → high P', col: 0, row: 1 },
    { id: 'cond', kind: 'condenser', label: 'Condenser', sublabel: 'rejects heat', col: 1, row: 0 },
    { id: 'meter', kind: 'metering', label: 'Metering', sublabel: 'high P → low P', col: 2, row: 1 },
    { id: 'evap', kind: 'evaporator', label: 'Evaporator', sublabel: 'absorbs heat', col: 1, row: 2 },
  ],
  links: [
    { from: 'comp', to: 'cond', label: 'hot gas' },
    { from: 'cond', to: 'meter', label: 'liquid' },
    { from: 'meter', to: 'evap', label: 'mixture' },
    { from: 'evap', to: 'comp', label: 'cool vapour' },
  ],
};

// --- 2.1 The four components ------------------------------------------------

const fourComponents = defineQuestion({
  ...T,
  id: 'hvac.2.1.four-components',
  objective: '2.1',
  kind: 'match',
  difficulty: 1,
  topology: cycleDiagram,
  prompt: 'Match each component to its job in the cycle.',
  pairs: [
    ['Compressor', 'Raises pressure and moves refrigerant around the loop'],
    ['Condenser', 'Rejects heat to the outdoors; refrigerant condenses to liquid'],
    ['Metering device', 'Drops pressure so the refrigerant can boil at a low temperature'],
    ['Evaporator', 'Absorbs heat from the space; refrigerant boils to vapour'],
  ],
  explain:
    'Two components change pressure — the compressor raises it, the metering device drops it. ' +
    'Two change state — the condenser turns vapour to liquid, the evaporator turns liquid to ' +
    'vapour. They alternate around the loop.\n\n' +
    'The system is a heat pump in the literal sense: it does not make cold, it moves heat from ' +
    'where you do not want it to where you do not care about it. The compressor is what makes ' +
    'that uphill move possible.',
  source: cite.todo('Confirm against the refrigeration cycle chapter of your text.'),
  status: 'draft',
});

const compressorRole = defineQuestion({
  ...T,
  id: 'hvac.2.1.compressor-vapour-only',
  objective: '2.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why is liquid refrigerant returning to the compressor so damaging?',
  choices: [
    'Liquid does not compress, so it can break valves or a connecting rod, and it washes out the oil',
    'Liquid freezes inside the compressor and blocks it',
    'Liquid causes the compressor to run backwards',
    'It is not damaging — compressors are designed to handle liquid',
  ],
  answer: 0,
  explain:
    'A compressor is a vapour pump. Vapour compresses; liquid does not. A slug of liquid in the ' +
    'cylinder has nowhere to go, and something mechanical gives — valves, a rod, or the head.\n\n' +
    'The slower version is just as fatal: liquid dilutes the oil, washing the film off bearing ' +
    'surfaces until they fail. This is why superheat matters so much. Any superheat at all proves ' +
    'the refrigerant left the evaporator fully vaporised, and near-zero superheat is a ' +
    'shut-it-down condition rather than something to note and come back to.',
  source: cite.todo('Confirm the floodback discussion against your text.'),
  status: 'draft',
});

// --- 2.2 State through the cycle --------------------------------------------

const stateOrder = defineQuestion({
  ...T,
  id: 'hvac.2.2.state-sequence',
  objective: '2.2',
  kind: 'order',
  difficulty: 2,
  prompt: 'Put the refrigerant states in order, starting at the compressor outlet.',
  steps: [
    'High-pressure superheated vapour — compressor discharge',
    'High-pressure liquid — condenser outlet, subcooled',
    'Low-pressure liquid and vapour mixture — after the metering device',
    'Low-pressure superheated vapour — evaporator outlet, at the compressor suction',
  ],
  explain:
    'Pressure changes at two points only: it rises through the compressor and falls through the ' +
    'metering device. Everything between the compressor discharge and the metering device is high ' +
    'side; everything between the metering device and the compressor suction is low side.\n\n' +
    'Knowing which side of the loop you are standing at tells you which gauge should be reading ' +
    'what, and that alone catches a surprising number of mistakes.',
  source: cite.todo('Confirm the state points against your text.'),
  status: 'draft',
});

const meteringPressureDrop = defineQuestion({
  ...T,
  id: 'hvac.2.2.why-pressure-drop',
  objective: '2.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why must the metering device drop the pressure before refrigerant enters the evaporator?',
  choices: [
    'Because a lower pressure lowers the boiling point, so the refrigerant can boil at a temperature below room temperature',
    'To slow the refrigerant down so it spends longer in the coil',
    'To protect the evaporator from bursting',
    'To separate the liquid from the vapour',
  ],
  answer: 0,
  explain:
    'Heat only moves from warmer to cooler. For the coil to absorb heat from 75°F room air, the ' +
    'refrigerant inside it has to be colder than 75°F — and it has to be boiling, because that is ' +
    'where the capacity is.\n\n' +
    'Dropping the pressure is what makes that possible. At high side pressure the refrigerant ' +
    'would boil at 110°F or more, which is useless. Drop it to around 118 psig on R-410A and it ' +
    'boils at about 40°F, comfortably below room temperature, and the coil starts absorbing heat.',
  source: cite.standard('Pressure–temperature relationship'),
  status: 'verified',
});

// --- 2.3 P-T relationship ---------------------------------------------------

const ptWhereItApplies = defineQuestion({
  ...T,
  id: 'hvac.2.3.where-pt-applies',
  objective: '2.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Where in the system does a P-T chart correctly convert pressure to temperature?',
  choices: [
    'Only where liquid and vapour coexist — inside the evaporator and condenser',
    'Anywhere in the system, at any point',
    'Only on the high side',
    'Only when the system is off and pressures have equalised',
  ],
  answer: 0,
  whyWrong: {
    1: 'In the superheated or subcooled regions, pressure and temperature vary independently.',
    2: 'It applies equally on both sides, wherever a saturated mixture exists.',
    3: 'It applies while running; equalised pressures just reflect ambient.',
  },
  explain:
    'A P-T chart describes saturation — the condition where liquid and vapour are in equilibrium. ' +
    'That exists in the boiling part of the evaporator and the condensing part of the condenser, ' +
    'and nowhere else.\n\n' +
    'Once the last liquid boils away, adding heat raises temperature without changing pressure: ' +
    'that is superheat, and the chart no longer applies. Same on the other side — once all the ' +
    'vapour has condensed, further cooling drops temperature at constant pressure, which is ' +
    'subcooling.\n\n' +
    'This is precisely why superheat and subcooling exist as measurements. They quantify how far ' +
    'the actual temperature has departed from saturation, which is information a pressure gauge ' +
    'alone cannot give you.',
  source: cite.standard('Saturation properties — standard thermodynamics'),
  status: 'verified',
});

// --- 2.4 Superheat ----------------------------------------------------------

const superheatDefinition = defineQuestion({
  ...T,
  id: 'hvac.2.4.superheat-definition',
  objective: '2.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'How is superheat calculated?',
  choices: [
    'Suction line temperature minus the saturation temperature for the suction pressure',
    'Saturation temperature minus the suction line temperature',
    'Suction line temperature minus the return air temperature',
    'Discharge temperature minus suction temperature',
  ],
  answer: 0,
  whyWrong: {
    1: 'That subtraction is subcooling, and it is done on the high side.',
    2: 'Air temperatures do not enter into superheat.',
    3: 'That is the temperature rise across the compressor, a different quantity.',
  },
  explain:
    'Superheat = suction line temperature − evaporator saturation temperature.\n\n' +
    'You need two readings: the low-side gauge, converted to saturation temperature through the ' +
    'P-T chart for that refrigerant, and a thermometer clamped to the suction line and insulated ' +
    'from ambient air.\n\n' +
    'What it tells you is how much of the evaporator is doing useful work. Low superheat means ' +
    'liquid is reaching the end of the coil and heading for the compressor. High superheat means ' +
    'the last stretch of coil ran out of liquid early and is being wasted.',
  source: cite.standard('Superheat definition — standard refrigeration practice'),
  status: 'verified',
});

const zeroSuperheat = defineQuestion({
  ...T,
  id: 'hvac.2.4.zero-superheat',
  objective: '2.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system measures 1°F of superheat and the suction line is sweating back to the compressor.\n\n' +
    'What should you do?',
  choices: [
    'Treat it as an emergency — liquid is reaching the compressor and it should be shut down',
    'Note it and continue; low superheat means the coil is fully utilised',
    'Add refrigerant to raise the superheat',
    'Nothing — 1°F is within the normal 8–12°F band',
  ],
  answer: 0,
  whyWrong: {
    1: 'A fully utilised coil still shows several degrees of superheat. One degree means liquid is leaving it.',
    2: 'Adding charge lowers superheat further and makes floodback worse.',
    3: '1°F is nowhere near 8–12°F.',
  },
  explain:
    'Superheat that close to zero means the refrigerant leaving the evaporator is still a ' +
    'liquid–vapour mixture. The compressor is being fed liquid right now.\n\n' +
    'The sweating suction line is the visual confirmation: it is running at saturation temperature ' +
    'well past the point where it should have warmed up. Shut it down before you finish ' +
    'diagnosing — every minute it runs is doing mechanical damage.\n\n' +
    'Likely causes are an overcharge, a TXV sensing bulb that has come loose, or an evaporator ' +
    'getting far too little airflow to boil what is being fed to it.',
  source: cite.todo('Confirm the floodback response against your service text.'),
  status: 'draft',
});

// --- 2.5 Subcooling ---------------------------------------------------------

const subcoolingDefinition = defineQuestion({
  ...T,
  id: 'hvac.2.5.subcooling-definition',
  objective: '2.5',
  kind: 'choice',
  difficulty: 2,
  prompt: 'How is subcooling calculated?',
  choices: [
    'Condensing saturation temperature minus the liquid line temperature',
    'Liquid line temperature minus the condensing saturation temperature',
    'Condensing temperature minus outdoor ambient',
    'Liquid line temperature minus outdoor ambient',
  ],
  answer: 0,
  whyWrong: {
    1: 'The subtraction runs the other way — this would give a negative number on a healthy system.',
    2: 'That is condenser split.',
    3: 'That is not a standard measurement.',
  },
  explain:
    'Subcooling = condensing saturation temperature − liquid line temperature.\n\n' +
    'Note that it subtracts in the opposite direction from superheat, because the refrigerant is ' +
    'being cooled BELOW saturation rather than heated above it. Getting the direction backwards ' +
    'produces a negative number, which is the clue that the subtraction went the wrong way.\n\n' +
    'Subcooling tells you how much liquid is stacked in the condenser, which makes it the charge ' +
    'indicator on a TXV system — where the valve holds superheat at 8–12°F no matter how much ' +
    'refrigerant is in the system, so superheat tells you nothing about charge at all.',
  source: cite.standard('Subcooling definition — standard refrigeration practice'),
  status: 'verified',
});

const whySubcoolMatters = defineQuestion({
  ...T,
  id: 'hvac.2.5.why-subcooling-matters',
  objective: '2.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does a system need some subcooling rather than delivering saturated liquid to the metering device?',
  choices: [
    'To guarantee solid liquid at the metering device — vapour bubbles would reduce its capacity',
    'To lower the head pressure',
    'To increase the superheat',
    'To keep oil moving through the condenser',
  ],
  answer: 0,
  explain:
    'A metering device is sized to pass liquid. If the refrigerant reaching it is at saturation, ' +
    'the smallest pressure drop — a long line, a vertical rise, a slightly restrictive drier — ' +
    'flashes some of it to vapour. Vapour occupies far more volume than liquid, so the device ' +
    'passes much less refrigerant than it should, and the evaporator starves.\n\n' +
    'That is called flash gas, and the symptom is a system that behaves as though it were ' +
    'undercharged despite having the right amount of refrigerant in it. Subcooling is the margin ' +
    'that prevents it.',
  source: cite.todo('Confirm the flash gas discussion against your text.'),
  status: 'draft',
});

// --- 2.6 Condenser split ----------------------------------------------------

const splitDefinition = defineQuestion({
  ...T,
  id: 'hvac.2.6.condenser-split',
  objective: '2.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A standard-efficiency system has a condensing temperature of 130°F with an outdoor ambient of ' +
    '95°F. The coil looks clean.\n\nWhat does the condenser split tell you?',
  choices: [
    'A 35°F split is above the 20–30°F range, so heat rejection is impaired despite the clean coil',
    'A 35°F split is normal for a standard-efficiency unit',
    'The split cannot be judged without knowing the refrigerant',
    'A 35°F split means the condenser is oversized',
  ],
  answer: 0,
  explain:
    'Condenser split = condensing temperature − outdoor ambient = 130 − 95 = 35°F. A standard ' +
    'efficiency unit should run 20–30°F; a high-efficiency unit with its larger coil runs 15–20°F.\n\n' +
    '35°F says heat is not leaving the condenser as it should. With a clean coil and a running ' +
    'fan, the remaining suspects are non-condensables in the system, an overcharge flooding the ' +
    'lower coil rows, or recirculation — hot discharge air being drawn straight back in because ' +
    'something was built too close to the unit.\n\n' +
    'The split is a better first look than head pressure alone, because it already accounts for ' +
    'how hot it is outside. High head pressure on a 105°F day may be entirely normal.',
  source: cite.todo('Confirm the condenser split ranges against your service text.'),
  status: 'draft',
});

// --- hotspot questions on the cycle ----------------------------------------

const findEvaporator = defineQuestion({
  ...T,
  id: 'hvac.2.1.hotspot-heat-absorbed',
  objective: '2.1',
  kind: 'hotspot',
  difficulty: 1,
  topology: cycleDiagram,
  prompt: 'Click the component where heat is absorbed from the space being cooled.',
  answer: 'evap',
  whyWrong: {
    cond: 'The condenser REJECTS heat to the outdoors. It is the opposite end of the job.',
    comp: 'The compressor raises pressure. It adds heat to the refrigerant, but it does not absorb heat from the space.',
    meter: 'The metering device drops pressure. No meaningful heat transfer happens there.',
  },
  explain:
    'The evaporator is where refrigerant boils, and boiling absorbs enormous quantities of latent ' +
    'heat. That heat comes from the air passing over the coil, which is what cools the space.\n\n' +
    'The name is literal: it is where the refrigerant evaporates.',
  source: cite.standard('Standard vapour-compression cycle'),
  status: 'verified',
});

const findPressureDrop = defineQuestion({
  ...T,
  id: 'hvac.2.2.hotspot-pressure-drop',
  objective: '2.2',
  kind: 'hotspot',
  difficulty: 2,
  topology: cycleDiagram,
  prompt: 'Click the component where high-side pressure becomes low-side pressure.',
  answer: 'meter',
  whyWrong: {
    comp: 'The compressor does the opposite — it raises pressure from low side to high side.',
    cond: 'The condenser changes state at roughly constant pressure. It stays on the high side throughout.',
    evap: 'The evaporator changes state at roughly constant pressure. It is already on the low side.',
  },
  explain:
    'Pressure changes at exactly two points in the loop: it rises through the compressor and falls ' +
    'through the metering device. Everything between them is either all high side or all low side.\n\n' +
    'Knowing which side you are standing at tells you which gauge should read what, and that alone ' +
    'catches a surprising number of mistakes.',
  source: cite.standard('Standard vapour-compression cycle'),
  status: 'verified',
});

const findSuperheatMeasurement = defineQuestion({
  ...T,
  id: 'hvac.2.4.hotspot-superheat-location',
  objective: '2.4',
  kind: 'hotspot',
  difficulty: 3,
  topology: cycleDiagram,
  prompt:
    'You are measuring superheat. Click the component whose OUTLET line you clamp the thermometer to.',
  answer: 'evap',
  whyWrong: {
    cond: 'The condenser outlet is the liquid line — that is where you measure for subcooling.',
    comp: 'The compressor outlet is the hot gas discharge line, which is a different measurement.',
    meter: 'The metering device outlet carries a liquid-vapour mixture, still at saturation.',
  },
  explain:
    'Superheat is measured on the suction line — the evaporator outlet, running back to the ' +
    'compressor. Clamp the thermometer about six inches from the service valve and insulate it ' +
    'from ambient air.\n\n' +
    'Then read the low-side gauge, convert to saturation temperature, and subtract. Superheat = ' +
    'suction line temperature − evaporator saturation temperature.\n\n' +
    'Subcooling is the mirror image: measured at the condenser outlet, on the liquid line.',
  source: cite.standard('Superheat measurement — standard refrigeration practice'),
  status: 'verified',
});

// --- more 2.3 ---------------------------------------------------------------

const saturationMeaning = defineQuestion({
  ...T,
  id: 'hvac.2.3.what-saturation-means',
  objective: '2.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What does it mean for a refrigerant to be "saturated"?',
  choices: [
    'Liquid and vapour coexist in equilibrium, so pressure and temperature are locked together',
    'The refrigerant has absorbed all the heat it can',
    'The system is overcharged',
    'The refrigerant is contaminated with moisture',
  ],
  answer: 0,
  explain:
    'Saturation is the condition where liquid and vapour exist together. While that is true, ' +
    'pressure and temperature move as a pair — know one and a P-T chart gives you the other.\n\n' +
    'That state exists in the boiling section of the evaporator and the condensing section of the ' +
    'condenser, and nowhere else. Outside those regions the two become independent, which is ' +
    'exactly what superheat and subcooling measure.',
  source: cite.standard('Saturation properties — standard thermodynamics'),
  status: 'verified',
});

const ptChartUse = defineQuestion({
  ...T,
  id: 'hvac.2.3.reading-a-chart',
  objective: '2.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Your low-side gauge reads 118 psig on an R-410A system, and the suction line measures 68°F.\n\n' +
    'What is the superheat?',
  choices: ['28°F', '50°F', '68°F', 'Cannot be determined without the subcooling'],
  answer: 0,
  whyWrong: {
    1: 'That would be the saturation temperature subtracted from something else.',
    2: 'That is just the line temperature.',
    3: 'Superheat and subcooling are independent measurements.',
  },
  explain:
    '118 psig on the R-410A scale is a saturation temperature of about 40°F.\n\n' +
    'Superheat = suction line temperature − saturation temperature = 68 − 40 = **28°F**.\n\n' +
    'That is high. A TXV system should hold 8–12°F, so 28°F says the coil is starving — either an ' +
    'undercharge or a restriction. Subcooling would tell you which.',
  source: cite.standard('R-410A saturation at 118 psig ≈ 40°F'),
  status: 'verified',
});

// --- more 2.5 / 2.6 ---------------------------------------------------------

const subcoolingDirection = defineQuestion({
  ...T,
  id: 'hvac.2.5.negative-subcooling',
  objective: '2.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You calculate subcooling and get −8°F.\n\nWhat has most likely happened?',
  choices: [
    'You subtracted in the wrong direction',
    'The system has negative subcooling, which indicates an overcharge',
    'The liquid line is colder than possible',
    'The gauge is reading incorrectly',
  ],
  answer: 0,
  explain:
    'Subcooling counts DOWN from saturation: condensing temperature − liquid line temperature. ' +
    'Superheat counts UP: suction line temperature − saturation temperature.\n\n' +
    'The two subtract in opposite directions, and mixing them up is the single most common ' +
    'arithmetic error in this work. A negative result is the clue that you did.\n\n' +
    'Genuine zero subcooling is possible — it means no liquid is stacked in the condenser at all, ' +
    'a severe undercharge — but a *negative* number is not physically meaningful.',
  source: cite.standard('Subcooling definition — standard refrigeration practice'),
  status: 'verified',
});

const splitCalculation = defineQuestion({
  ...T,
  id: 'hvac.2.6.split-calculation',
  objective: '2.6',
  kind: 'input',
  difficulty: 2,
  prompt:
    'An R-410A system reads 365 psig on the high side, and outdoor ambient is 95°F.\n\n' +
    'What is the condenser split, in °F? (365 psig ≈ 110°F saturation.)',
  placeholder: '°F',
  accept: ['15'],
  tolerance: 2,
  explain:
    'Condenser split = condensing temperature − outdoor ambient = 110 − 95 = **15°F**.\n\n' +
    'For a standard-efficiency unit that would be unusually tight; for a high-efficiency unit ' +
    'with its larger coil it is right in the expected 15–20°F band.\n\n' +
    'The split is more useful than head pressure alone because it already accounts for the ' +
    'weather. 365 psig sounds high until you notice it is 95°F outside.',
  source: cite.standard('Arithmetic: 110 − 95'),
  status: 'verified',
});

const compressionRatio = defineQuestion({
  ...T,
  id: 'hvac.2.6.why-head-pressure-costs',
  objective: '2.6',
  kind: 'choice',
  difficulty: 3,
  prompt: 'Why does high head pressure reduce capacity as well as raising running cost?',
  choices: [
    'The compressor works harder per pound moved, and less refrigerant flows for the same effort',
    'High pressure makes the refrigerant leak faster',
    'It causes the metering device to close',
    'It has no effect on capacity, only on amps',
  ],
  answer: 0,
  explain:
    'The compressor has to lift refrigerant from suction pressure to discharge pressure. Raise the ' +
    'discharge side and that lift gets bigger, so each pound of refrigerant costs more energy — ' +
    'amps go up.\n\n' +
    'At the same time the compressor moves less refrigerant per revolution, because more of the ' +
    'cylinder volume is taken up re-expanding gas left over from the previous stroke. Less flow ' +
    'means less capacity.\n\n' +
    'So high head pressure costs you twice: more power in, less cooling out. That is why a dirty ' +
    'condenser is not a minor efficiency issue.',
  source: cite.todo('Confirm the compression ratio discussion against your text.'),
  status: 'draft',
});

export const SECTOR_2_QUESTIONS: readonly Question[] = [
  fourComponents,
  findEvaporator,
  findPressureDrop,
  compressorRole,
  stateOrder,
  meteringPressureDrop,
  saturationMeaning,
  ptWhereItApplies,
  ptChartUse,
  superheatDefinition,
  findSuperheatMeasurement,
  zeroSuperheat,
  subcoolingDefinition,
  subcoolingDirection,
  whySubcoolMatters,
  splitDefinition,
  splitCalculation,
  compressionRatio,
];
