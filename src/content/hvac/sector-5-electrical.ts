import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Sector 5 — Electrical Fundamentals.
 *
 * Most no-cool calls turn out to be electrical rather than refrigerant-side, and
 * the meter is faster than the gauges. This is also the sector where a mistake
 * can kill you, which is why the safety items are not optional filler.
 */

const T = { track: 'hvac', domain: '5.0' } as const;

// --- 5.1 Ohm's law ----------------------------------------------------------

const ohmsRelationships = defineQuestion({
  ...T,
  id: 'hvac.5.1.ohms-forms',
  objective: '5.1',
  kind: 'match',
  difficulty: 1,
  prompt: "Match each form of Ohm's law and the power formula to what it solves for.",
  pairs: [
    ['E = I × R', 'Voltage, from current and resistance'],
    ['I = E ÷ R', 'Current, from voltage and resistance'],
    ['R = E ÷ I', 'Resistance, from voltage and current'],
    ['P = E × I', 'Power in watts, from voltage and current'],
  ],
  explain:
    'One relationship, rearranged three ways, plus the power formula.\n\n' +
    'In the field R = E ÷ I gets the most use, because voltage and current are what a meter reads ' +
    'directly on a live circuit — you rarely measure resistance on something energised, and you ' +
    'should never try.',
  source: cite.standard("Ohm's law"),
  status: 'verified',
});

// --- 5.2 Series and parallel -------------------------------------------------

const seriesParallelBehaviour = defineQuestion({
  ...T,
  id: 'hvac.5.2.series-vs-parallel',
  objective: '5.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why are safety controls wired in series with the load, while the loads themselves are wired ' +
    'in parallel?',
  choices: [
    'Series means every control must close for the load to run; parallel means each load sees full voltage independently',
    'Series is cheaper to wire; parallel uses less copper',
    'Series carries more current; parallel carries less',
    'It is a code requirement with no functional reason',
  ],
  answer: 0,
  explain:
    'A series string is an AND: high-pressure switch AND low-pressure switch AND float switch all ' +
    'have to be closed. Any one opening stops the load, which is exactly what a safety chain is ' +
    'for.\n\n' +
    'Loads go in parallel so each gets the full supply voltage and can operate independently — ' +
    'the blower does not care whether the compressor is running.\n\n' +
    'This is what makes voltage-drop troubleshooting work. In a series string, the full supply ' +
    'voltage appears across whichever device is open, and nearly zero across the closed ones. ' +
    'Walk the string with a meter and the open one announces itself.',
  source: cite.todo('Confirm against the electrical circuits chapter of your text.'),
  status: 'draft',
});

const openSwitchVoltage = defineQuestion({
  ...T,
  id: 'hvac.5.2.voltage-across-open',
  objective: '5.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A 24 V control circuit has four safety switches in series with a contactor coil. The ' +
    'contactor is not pulling in. You measure 24 V across the third switch and about 0 V across ' +
    'the others.\n\nWhat does that tell you?',
  choices: [
    'The third switch is open — it is the one interrupting the circuit',
    'The third switch is closed and working correctly',
    'The transformer is failing',
    'The contactor coil is shorted',
  ],
  answer: 0,
  explain:
    'In a series circuit the supply voltage divides across the resistances. A closed switch has ' +
    'almost no resistance, so almost no voltage appears across it. An open switch is effectively ' +
    'infinite resistance, so the entire supply voltage appears across it.\n\n' +
    'Reading full voltage across a switch that should be closed is the definitive test that it is ' +
    'open. This beats resistance testing because it can be done live, in place, without ' +
    'disconnecting anything.\n\n' +
    'The next question is why it is open — a genuine fault it is protecting against, or a failed ' +
    'switch. Jumping it out to "test" is how equipment gets destroyed and people get hurt.',
  source: cite.todo('Confirm the voltage-drop method against your text.'),
  status: 'draft',
});

// --- 5.3 Motors ---------------------------------------------------------------

const motorTerminals = defineQuestion({
  ...T,
  id: 'hvac.5.3.compressor-terminals',
  objective: '5.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'On a single-phase compressor you measure between terminals: C–S = 6 Ω, C–R = 2 Ω.\n\n' +
    'What should R–S measure on a healthy compressor?',
  choices: [
    '8 Ω — the start and run windings in series through common',
    '4 Ω — the difference between them',
    '12 Ω — the product of them',
    '0 Ω — the windings are isolated from each other',
  ],
  answer: 0,
  explain:
    'The two windings share the common terminal, so measuring R to S puts them in series: ' +
    '2 + 6 = 8 Ω. That relationship is the check — the largest reading always equals the sum of ' +
    'the other two.\n\n' +
    'It also identifies unmarked terminals: the highest reading is between run and start, so the ' +
    'terminal not involved in it is common. Of the remaining two, the one with higher resistance ' +
    'to common is start (more turns of finer wire), the lower one is run.\n\n' +
    'If the numbers do not add up, a winding is damaged. Also check each terminal to the shell — ' +
    'any continuity to ground means the compressor is grounded and must be replaced.',
  source: cite.standard('Series resistance: R–S = (C–R) + (C–S)'),
  status: 'verified',
});

// --- 5.4 Capacitors ------------------------------------------------------------

const capacitorRoles = defineQuestion({
  ...T,
  id: 'hvac.5.4.run-vs-start',
  objective: '5.4',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each capacitor type to its role.',
  pairs: [
    ['Run capacitor', 'Stays in circuit continuously, improving efficiency and torque'],
    ['Start capacitor', 'Briefly in circuit at start-up for extra starting torque, then switched out'],
    ['Dual run capacitor', 'One can serving both the compressor and the condenser fan'],
  ],
  explain:
    'A run capacitor is rated for continuous duty and has a relatively low microfarad value. A ' +
    'start capacitor has a much higher value and is designed for seconds of use — leave one in ' +
    'circuit and it fails quickly.\n\n' +
    'A dual capacitor has three terminals: C (common), HERM (compressor) and FAN. Reading a dual ' +
    'means measuring HERM-to-C and FAN-to-C separately, since half can fail while the other half ' +
    'still tests fine.\n\n' +
    'Always discharge a capacitor before handling it. They hold a charge long after power is off, ' +
    'and a large one holds enough energy to injure you.',
  source: cite.todo('Confirm capacitor types against your text.'),
  status: 'draft',
});

// --- 5.5 Controls --------------------------------------------------------------

const controlComponents = defineQuestion({
  ...T,
  id: 'hvac.5.5.component-roles',
  objective: '5.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each control component to its function.',
  pairs: [
    ['Contactor', 'Uses a low-voltage coil to switch the high-voltage load'],
    ['Transformer', 'Steps line voltage down to 24 V for the control circuit'],
    ['Sequencer', 'Brings electric heat strips on in stages to limit inrush current'],
    ['Pressure switch', 'Opens the control circuit when refrigerant pressure goes out of range'],
    ['Overload', 'Opens on excessive current or temperature to protect a motor'],
  ],
  explain:
    'The pattern is that a small, safe, low-voltage signal controls a large, dangerous, ' +
    'high-voltage load. The thermostat never switches 240 V — it switches 24 V to a contactor ' +
    'coil, and the contactor does the real work.\n\n' +
    'This is why control-circuit troubleshooting usually starts at the transformer. No 24 V ' +
    'secondary means nothing downstream can operate, and it is a two-second check.',
  source: cite.todo('Confirm the component list against your text.'),
  status: 'draft',
});

const thermostatWiring = defineQuestion({
  ...T,
  id: 'hvac.5.5.thermostat-letters',
  objective: '5.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each conventional thermostat terminal to what it does.',
  pairs: [
    ['R', '24 V hot from the transformer'],
    ['C', 'Common — the return side of the 24 V circuit'],
    ['Y', 'Calls for cooling — energises the compressor contactor'],
    ['G', 'Calls for the indoor blower'],
    ['W', 'Calls for heat'],
    ['O/B', 'Energises the reversing valve on a heat pump'],
  ],
  explain:
    'These are conventions rather than a standard, and manufacturers do deviate — always check ' +
    'the wiring diagram on the equipment rather than assuming.\n\n' +
    'C is the one that causes most modern trouble. Older systems often ran without it, but ' +
    'communicating and Wi-Fi thermostats need a common wire for continuous power, and "the new ' +
    'thermostat keeps dropping off" is very often a missing C.\n\n' +
    'O versus B matters on heat pumps: O energises the reversing valve in cooling, B energises it ' +
    'in heating. Getting it backwards gives you heat when you asked for cooling.',
  source: cite.todo('Confirm the terminal conventions against your text and the equipment diagram.'),
  status: 'draft',
});

// --- 5.6 Ladder diagrams --------------------------------------------------------

const ladderReading = defineQuestion({
  ...T,
  id: 'hvac.5.6.ladder-structure',
  objective: '5.6',
  kind: 'choice',
  difficulty: 2,
  prompt: 'How is a ladder diagram organised?',
  choices: [
    'Two vertical power rails with each rung running load-side from one to the other, controls before the load',
    'Components drawn in their physical positions inside the cabinet',
    'A single line showing the order of operations in time',
    'Wires drawn in their actual colours and lengths',
  ],
  answer: 0,
  whyWrong: {
    1: 'That is a pictorial or connection diagram — useful for finding a part, not for tracing logic.',
    2: 'A ladder shows electrical logic, not sequence in time.',
    3: 'Colours appear as labels; the layout is logical rather than physical.',
  },
  explain:
    'Each rung is one complete circuit: power rail, then the switches and contacts that control ' +
    'it, then the load, then the other rail. Reading left to right tells you every condition that ' +
    'has to be satisfied for that load to run.\n\n' +
    'The convention of putting controls before the load matters for troubleshooting. It means you ' +
    'can work along a rung with a meter, and the point where voltage disappears is the point of ' +
    'the fault.\n\n' +
    'Relay contacts are labelled with the coil that operates them, so a contact marked CR1 is ' +
    'controlled by the CR1 coil elsewhere in the diagram. Following those cross-references is how ' +
    'you trace a sequence.',
  source: cite.todo('Confirm the ladder diagram conventions against your text.'),
  status: 'draft',
});

// --- 5.7 Meter safety -----------------------------------------------------------

const meterVerification = defineQuestion({
  ...T,
  id: 'hvac.5.7.live-dead-live',
  objective: '5.7',
  kind: 'order',
  difficulty: 2,
  prompt: 'Put the steps of verifying a circuit is de-energised in the correct order.',
  steps: [
    'Test the meter on a known live source to prove it works',
    'Test the circuit you intend to work on',
    'Test the meter on the known live source again to prove it still works',
  ],
  explain:
    'Live–dead–live. The second live test is the one people skip and the one that matters: a ' +
    'meter with a blown fuse, a flat battery or a broken lead reads zero volts on everything, ' +
    'including a circuit that is fully energised.\n\n' +
    'Without the final check, "the meter read zero" and "the circuit is dead" are not the same ' +
    'statement, and the difference can kill you.',
  source: cite.standard('NFPA 70E electrical safety practice'),
  status: 'verified',
});

const capacitorDischarge = defineQuestion({
  ...T,
  id: 'hvac.5.7.discharge-capacitor',
  objective: '5.7',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You have opened the disconnect on a condensing unit and are about to test the dual run ' +
    'capacitor.\n\nWhat must you do first?',
  choices: [
    'Discharge the capacitor across its terminals through a resistor before touching it',
    'Nothing — opening the disconnect removes all stored energy',
    'Wait five minutes; capacitors self-discharge in that time',
    'Short the terminals directly with a screwdriver blade',
  ],
  answer: 0,
  whyWrong: {
    1: 'A capacitor stores charge independently of the supply. Removing power does not empty it.',
    2: 'Bleed-down is not guaranteed, and not all capacitors have bleed resistors.',
    3: 'A direct short produces a violent arc and can damage the capacitor and injure you.',
  },
  explain:
    'A capacitor is an energy store. It holds its charge after the disconnect opens, and a large ' +
    'run capacitor holds enough to hurt you badly.\n\n' +
    'Discharge it deliberately, through a resistor — a 20 kΩ 2 W resistor across the terminals is ' +
    'the usual tool. Shorting with a screwdriver works in the sense that it dumps the charge, but ' +
    'it does so as an arc and it is how people end up with burns and damaged tools.\n\n' +
    'On a dual capacitor, discharge HERM-to-C and FAN-to-C separately.',
  source: cite.todo('Confirm the discharge procedure against your safety text.'),
  status: 'draft',
});

export const SECTOR_5_QUESTIONS: readonly Question[] = [
  ohmsRelationships,
  seriesParallelBehaviour,
  openSwitchVoltage,
  motorTerminals,
  capacitorRoles,
  controlComponents,
  thermostatWiring,
  ladderReading,
  meterVerification,
  capacitorDischarge,
];
