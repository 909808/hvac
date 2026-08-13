import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 5 — additional questions. Continuation of `sector-5-electrical.ts`. */

const T = { track: 'hvac', domain: '5.0' } as const;

const powerCalc = defineQuestion({
  ...T,
  id: 'hvac.5.1.heat-strip-power',
  objective: '5.1',
  kind: 'input',
  difficulty: 2,
  prompt:
    'A 240 V electric heat strip draws 21 A.\n\nWhat is its output in watts?',
  placeholder: 'W',
  accept: ['5040'],
  tolerance: 100,
  explain:
    'P = E × I = 240 × 21 = **5,040 W**.\n\n' +
    'Convert to BTU/h by multiplying by 3.412: 5,040 × 3.412 ≈ 17,200 BTU/h. That conversion is ' +
    'worth knowing, because heat strips are rated in kW and everything else in the trade is in ' +
    'BTU/h.\n\n' +
    'Resistance heat is purely resistive, so watts and volt-amps are the same here. Motors are ' +
    'inductive and need a power factor in the calculation.',
  source: cite.standard('P = E × I'),
  status: 'verified',
});

const voltageDropCause = defineQuestion({
  ...T,
  id: 'hvac.5.1.voltage-drop-under-load',
  objective: '5.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Line voltage reads 240 V with the unit off and 205 V while the compressor runs.\n\n' +
    'What does that indicate?',
  choices: [
    'Excessive voltage drop — undersized conductors, a long run, or a loose connection',
    'Normal behaviour under load',
    'The compressor is drawing too little current',
    'The meter is faulty',
  ],
  answer: 0,
  explain:
    'Some drop under load is normal; 35 V is not. Voltage drops across resistance, and the ' +
    'resistance is in the supply path rather than in the load.\n\n' +
    'Suspects: undersized conductors for the run length, a corroded or loose connection at the ' +
    'disconnect or contactor, or a failing breaker.\n\n' +
    'Low voltage makes a motor draw **more** current to deliver the same power, which heats the ' +
    'windings and shortens its life. A compressor failing repeatedly on a circuit with poor voltage ' +
    'is failing because of the circuit.',
  source: cite.todo('Confirm voltage drop limits against your text and applicable code.'),
  status: 'draft',
});

const threePhaseAdvantage = defineQuestion({
  ...T,
  id: 'hvac.5.1.three-phase',
  objective: '5.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why is three-phase power preferred for larger commercial equipment?',
  choices: [
    'Smoother power delivery and smaller conductors for the same load, with motors that need no start components',
    'It is safer to work on',
    'It delivers higher voltage in all cases',
    'It eliminates the need for a disconnect',
  ],
  answer: 0,
  explain:
    'Three phases overlap, so power delivery is continuous rather than pulsing. That means a ' +
    'smoother torque, less vibration, and — usefully — a rotating magnetic field that starts a ' +
    'motor without needing a start capacitor or start winding at all.\n\n' +
    'It also carries more power for the same conductor size, which matters on large equipment.\n\n' +
    'Diagnostically: a three-phase motor running on two phases (single-phasing) overheats fast and ' +
    'is a common failure after one fuse opens.',
  source: cite.todo('Confirm the three-phase discussion against your text.'),
  status: 'draft',
});

const startVsRunWinding = defineQuestion({
  ...T,
  id: 'hvac.5.3.start-winding',
  objective: '5.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does a single-phase motor need a start winding at all?',
  choices: [
    'Single-phase power alone produces no rotating field, so the motor has no starting direction',
    'The start winding provides extra power at all times',
    'It reduces running current',
    'It protects the run winding from overheating',
  ],
  answer: 0,
  explain:
    'A single-phase supply produces a field that pulses back and forth rather than rotating. A ' +
    'motor sitting still in that field has no reason to turn one way rather than the other.\n\n' +
    'The start winding — more turns of finer wire, offset in the stator, with a capacitor shifting ' +
    'its current out of phase — creates an artificial second phase. That gives a rotating field and ' +
    'the rotor follows it.\n\n' +
    'Once turning, the motor sustains itself, which is why start windings and start capacitors are ' +
    'switched out after startup. Three-phase motors need none of this, because the supply is ' +
    'already rotating.',
  source: cite.todo('Confirm the motor theory against your text.'),
  status: 'draft',
});

const hardStartKit = defineQuestion({
  ...T,
  id: 'hvac.5.4.hard-start-kit',
  objective: '5.4',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does a hard-start kit do, and what does it tell you diagnostically?',
  choices: [
    'Adds a start capacitor and relay for extra starting torque — if it fixes the problem, the compressor is weak',
    'Increases the running current permanently',
    'Replaces the run capacitor',
    'Slows the compressor down at startup',
  ],
  answer: 0,
  explain:
    'A hard-start kit is a start capacitor plus a potential relay that switches it out once the ' +
    'motor is up to speed. It gives a large torque boost for the first fraction of a second.\n\n' +
    'The diagnostic value is what it reveals. A healthy compressor with a good run capacitor does ' +
    'not need one. If fitting one gets a struggling compressor started, the compressor is weak and ' +
    'on its way out — you have bought time, not fixed anything.\n\n' +
    'Fitting one as a matter of course masks developing failures and adds a component that can ' +
    'itself fail.',
  source: cite.todo('Confirm the hard-start kit discussion against your text.'),
  status: 'draft',
});

const transformerVa = defineQuestion({
  ...T,
  id: 'hvac.5.5.transformer-sizing',
  objective: '5.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A 40 VA control transformer feeds a contactor coil, a gas valve and a damper motor whose ' +
    'combined draw is 48 VA.\n\nWhat happens?',
  choices: [
    'Secondary voltage sags under load, causing chatter, dropouts and eventual transformer failure',
    'Nothing — transformers self-limit safely',
    'The secondary voltage rises',
    'The primary fuse opens immediately',
  ],
  answer: 0,
  explain:
    'An overloaded transformer cannot hold its secondary voltage. It sags, and 24 V devices start ' +
    'behaving marginally — contactors chatter, gas valves fail to hold, boards reset.\n\n' +
    'It also runs hot, and sustained overload eventually kills it.\n\n' +
    'The diagnostic tell is the same as for chatter generally: **measure under load**. A ' +
    'transformer that reads a healthy 26 V with nothing energised and collapses to 17 V when the ' +
    'contactor pulls in is the whole answer.',
  source: cite.todo('Confirm transformer sizing guidance against your text.'),
  status: 'draft',
});

const relayVsContactor = defineQuestion({
  ...T,
  id: 'hvac.5.5.relay-vs-contactor',
  objective: '5.5',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What distinguishes a contactor from a relay?',
  choices: [
    'A contactor is built for larger loads, with heavier contacts and often an arc-quenching design',
    'A relay uses AC and a contactor uses DC',
    'A contactor has no coil',
    'They are the same device under two names',
  ],
  answer: 0,
  explain:
    'Both are a coil operating a set of contacts. The difference is scale: a contactor switches ' +
    'motor loads with heavy contacts designed to survive the arc that occurs on every break.\n\n' +
    'Relays handle smaller loads — a blower relay, a fan relay on a board.\n\n' +
    'Contactor contacts are a wear item. Pitted, burned or welded contacts are a routine finding, ' +
    'and welded contacts are the reason a compressor sometimes will not shut off.',
  source: cite.todo('Confirm the component distinction against your text.'),
  status: 'draft',
});

const ohmingACoil = defineQuestion({
  ...T,
  id: 'hvac.5.7.testing-a-coil',
  objective: '5.7',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You measure a contactor coil and read infinite resistance.\n\nWhat does that mean?',
  choices: [
    'The coil is open and the contactor will never pull in, regardless of control voltage',
    'The coil is shorted',
    'The coil is healthy',
    'The reading is meaningless on a coil',
  ],
  answer: 0,
  explain:
    'A coil is a long winding of fine wire, so it should read a definite resistance — typically ' +
    'tens to hundreds of ohms depending on the device.\n\n' +
    'Infinite means the winding is broken. No current can flow, no magnetic field forms, and the ' +
    'contactor cannot pull in even with perfect 24 V across it.\n\n' +
    'Near-zero would mean shorted, which typically draws far more than the transformer can supply ' +
    'and causes the sagging-voltage symptoms. Both are replace-the-part findings.\n\n' +
    'Test with the power off and the coil disconnected from the circuit, or parallel paths will ' +
    'give you a misleading reading.',
  source: cite.todo('Confirm coil testing procedure against your text.'),
  status: 'draft',
});

export const SECTOR_5_EXTRA: readonly Question[] = [
  powerCalc,
  voltageDropCause,
  threePhaseAdvantage,
  startVsRunWinding,
  hardStartKit,
  transformerVa,
  relayVsContactor,
  ohmingACoil,
];
