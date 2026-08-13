import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 2 — additional questions. Continuation of `sector-2-cycle.ts`. */

const T = { track: 'hvac', domain: '2.0' } as const;

const compressorTypes = defineQuestion({
  ...T,
  id: 'hvac.2.1.compressor-types',
  objective: '2.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each compressor type to how it works.',
  pairs: [
    ['Reciprocating', 'Pistons in cylinders, with suction and discharge valves'],
    ['Scroll', 'Two interleaved spirals, one orbiting, compressing gas toward the centre'],
    ['Rotary', 'A roller inside a cylinder, common in small equipment'],
    ['Screw', 'Meshing helical rotors, used in large commercial plant'],
  ],
  explain:
    'Scroll compressors dominate residential equipment now. They have far fewer moving parts than ' +
    'a reciprocating compressor, run more quietly, and tolerate a small amount of liquid better — ' +
    'though "better" is not "safely".\n\n' +
    'The type matters diagnostically: a reciprocating compressor fails at its valves, which is the ' +
    'classic pressures-converging signature. A scroll more often fails by losing its ability to ' +
    'seal, or seizes outright.',
  source: cite.todo('Confirm the compressor type descriptions against your text.'),
  status: 'draft',
});

const accumulatorPurpose = defineQuestion({
  ...T,
  id: 'hvac.2.1.accumulator',
  objective: '2.1',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does a suction line accumulator do?',
  choices: [
    'Catches liquid refrigerant before it reaches the compressor and meters it back slowly',
    'Stores extra refrigerant for high-load conditions',
    'Separates oil from the refrigerant',
    'Reduces suction line noise',
  ],
  answer: 0,
  explain:
    'It is a safety device against floodback. Refrigerant entering it drops into a reservoir; only ' +
    'vapour is drawn off the top, through a tube that also picks up a small metered amount of oil ' +
    'so the oil still returns.\n\n' +
    'You see them most often on heat pumps, because defrost and low-ambient heating both create ' +
    'conditions where liquid can return. Finding one on a system is a hint that the designer ' +
    'expected floodback to be possible.\n\n' +
    'It buys tolerance, not immunity. Near-zero superheat is still a shut-it-down condition.',
  source: cite.todo('Confirm the accumulator description against your text.'),
  status: 'draft',
});

const receiverPurpose = defineQuestion({
  ...T,
  id: 'hvac.2.1.receiver',
  objective: '2.1',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What is a liquid line receiver for, and where does it sit?',
  choices: [
    'It stores liquid refrigerant after the condenser, so charge can vary with load',
    'It stores vapour before the compressor',
    'It removes moisture from the liquid line',
    'It reduces liquid line pressure before the metering device',
  ],
  answer: 0,
  explain:
    'A receiver sits between the condenser outlet and the metering device, holding a reservoir of ' +
    'liquid. That lets the active charge vary as load changes without starving the metering device.\n\n' +
    'It has a diagnostic consequence: on a system with a receiver, **subcooling at the condenser ' +
    'outlet is not a reliable charge indicator**, because the receiver decouples the two. Follow ' +
    'the manufacturer\'s procedure, which usually means sight glass or weighed charge instead.\n\n' +
    'Most residential split systems have no receiver, which is exactly why subcooling works so ' +
    'well there.',
  source: cite.todo('Confirm the receiver discussion against your text.'),
  status: 'draft',
});

const sightGlass = defineQuestion({
  ...T,
  id: 'hvac.2.2.sight-glass-bubbles',
  objective: '2.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A liquid line sight glass shows bubbles on a running system.\n\nWhat does that indicate?',
  choices: [
    'Vapour in the liquid line — insufficient subcooling, a low charge, or a restriction upstream',
    'Normal operation at full charge',
    'Moisture in the system',
    'Oil circulating correctly',
  ],
  answer: 0,
  explain:
    'The liquid line should be exactly that: solid liquid. Bubbles mean some has flashed to ' +
    'vapour, which starves the metering device because vapour occupies far more volume.\n\n' +
    'Causes: not enough subcooling to survive the pressure drop down the line, a genuine ' +
    'undercharge, or a restriction upstream of the glass such as a plugged drier.\n\n' +
    'The moisture indicator is a separate feature of the same fitting — a colour patch, usually ' +
    'green for dry and yellow for wet. Bubbles and colour are telling you different things.',
  source: cite.todo('Confirm the sight glass discussion against your text.'),
  status: 'draft',
});

const superheatCalcTwo = defineQuestion({
  ...T,
  id: 'hvac.2.4.superheat-calc-r22',
  objective: '2.4',
  kind: 'input',
  difficulty: 2,
  prompt:
    'An R-22 system reads 68.5 psig on the low side (≈40°F saturation) and the suction line ' +
    'measures 51°F.\n\nWhat is the superheat, in °F?',
  placeholder: '°F',
  accept: ['11'],
  tolerance: 2,
  explain:
    'Superheat = suction line temperature − saturation temperature = 51 − 40 = **11°F**.\n\n' +
    'That sits inside the 8–12°F band a TXV should hold, so on a TXV system this looks healthy. ' +
    'On a fixed orifice you would compare it against the chart target for the current indoor wet ' +
    'bulb and outdoor dry bulb instead.',
  source: cite.standard('Arithmetic: 51 − 40'),
  status: 'verified',
});

const highSuperheatCause = defineQuestion({
  ...T,
  id: 'hvac.2.4.what-raises-superheat',
  objective: '2.4',
  kind: 'multi',
  difficulty: 3,
  prompt: 'Which conditions raise superheat? Select all that apply.',
  choices: [
    'Undercharge',
    'A restriction in the liquid line',
    'An overcharge',
    'A metering device stuck too far closed',
  ],
  answers: [0, 1, 3],
  explain:
    'Superheat rises whenever the evaporator is **starved** — not enough refrigerant reaching it to ' +
    'boil across the whole coil.\n\n' +
    'An undercharge starves it because there is too little in the system. A restriction or a ' +
    'closed-down metering device starves it because flow is throttled.\n\n' +
    'An overcharge does the opposite: more refrigerant reaches the coil, the boiling point moves ' +
    'further along it, and superheat falls. That is why low superheat with high subcooling is the ' +
    'overcharge signature.',
  source: cite.todo('Confirm the superheat causes against your service text.'),
  status: 'draft',
});

const subcoolingZero = defineQuestion({
  ...T,
  id: 'hvac.2.5.zero-subcooling',
  objective: '2.5',
  kind: 'choice',
  difficulty: 3,
  prompt: 'A system measures 0°F of subcooling. What does that mean physically?',
  choices: [
    'No liquid is stacking in the condenser — refrigerant is leaving it right at saturation',
    'The condenser is completely full of liquid',
    'The liquid line is the same temperature as the outdoor air',
    'The measurement is invalid',
  ],
  answer: 0,
  explain:
    'Subcooling counts how far below condensing temperature the liquid has been cooled. Zero means ' +
    'it has not been cooled below saturation at all, which means there is no reservoir of liquid ' +
    'backing up in the condenser.\n\n' +
    'On a system without a receiver that is a severe undercharge. It also guarantees flash gas: ' +
    'any pressure drop in the liquid line will vaporise some of it, starving the metering device ' +
    'further.\n\n' +
    'Zero is physically real. A *negative* number means you subtracted the wrong way round.',
  source: cite.standard('Subcooling definition'),
  status: 'verified',
});

const splitHighEfficiency = defineQuestion({
  ...T,
  id: 'hvac.2.6.why-high-eff-tighter-split',
  objective: '2.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does a high-efficiency condenser run a tighter split (15–20°F) than a standard one (20–30°F)?',
  choices: [
    'A larger coil rejects the same heat at a lower temperature difference',
    'It uses a different refrigerant',
    'Its compressor runs cooler',
    'It runs at a lower charge',
  ],
  answer: 0,
  explain:
    'Heat transfer is driven by temperature difference times surface area. Give the condenser more ' +
    'surface and it can reject the same heat with a smaller difference — so condensing temperature ' +
    'sits closer to ambient.\n\n' +
    'That lower condensing temperature is where the efficiency comes from: less head pressure ' +
    'means a smaller compression ratio, which means less power for the same capacity.\n\n' +
    'Practically: know which kind of unit you are looking at before judging the split. 22°F is ' +
    'fine on a standard unit and a warning sign on a high-efficiency one.',
  source: cite.todo('Confirm the split range discussion against your service text.'),
  status: 'draft',
});

const dischargeTemp = defineQuestion({
  ...T,
  id: 'hvac.2.6.discharge-temperature',
  objective: '2.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Compressor discharge line temperature is measured at 260°F.\n\nWhat should you conclude?',
  choices: [
    'Too hot — sustained high discharge temperature breaks down oil and damages the compressor',
    'Normal for a hot day',
    'The compressor is running efficiently',
    'Discharge temperature is not a meaningful measurement',
  ],
  answer: 0,
  explain:
    'Discharge temperature above roughly 225°F starts breaking down the oil. Past that, the oil ' +
    'carbonises, loses its lubricating film, and the compressor fails — usually months later, with ' +
    'no obvious connection to the cause.\n\n' +
    'What drives it up: high compression ratio (high head or low suction), high superheat returning ' +
    'to the compressor, or a compressor that is not being cooled by the suction gas as intended.\n\n' +
    'It is a useful reading precisely because it integrates several problems into one number. High ' +
    'discharge temperature says "something upstream is wrong" even before you know what.',
  source: cite.todo('Confirm discharge temperature limits against your text and manufacturer data.'),
  status: 'draft',
});

export const SECTOR_2_EXTRA: readonly Question[] = [
  compressorTypes,
  accumulatorPurpose,
  receiverPurpose,
  sightGlass,
  superheatCalcTwo,
  highSuperheatCause,
  subcoolingZero,
  splitHighEfficiency,
  dischargeTemp,
];
