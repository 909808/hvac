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

// --- more 5.1 / 5.2 ---------------------------------------------------------

const ohmsCalc = defineQuestion({
  ...T,
  id: 'hvac.5.1.resistance-from-readings',
  objective: '5.1',
  kind: 'input',
  difficulty: 2,
  prompt:
    'A 240 V heating element draws 20 A.\n\nWhat is its resistance, in ohms?',
  placeholder: 'Ω',
  accept: ['12'],
  tolerance: 0.5,
  explain:
    'R = E ÷ I = 240 ÷ 20 = **12 Ω**.\n\n' +
    'This form gets the most use in the field, because voltage and current are what a meter reads ' +
    'directly on a live circuit. You rarely measure resistance on something energised — and should ' +
    'never try.\n\n' +
    'Cross-check with power: P = E × I = 240 × 20 = 4,800 W, which is a plausible size for one ' +
    'heat strip.',
  source: cite.standard("Ohm's law"),
  status: 'verified',
});

const parallelIntuition = defineQuestion({
  ...T,
  id: 'hvac.5.2.parallel-lower',
  objective: '5.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Two 20 Ω resistances are wired in parallel. Without calculating, what do you know about the total?',
  choices: [
    'It is less than 20 Ω, because each added path gives current somewhere else to go',
    'It is 40 Ω, because resistances add',
    'It is exactly 20 Ω, because they are identical',
    'It depends on the applied voltage',
  ],
  answer: 0,
  explain:
    'Total resistance in parallel is always **lower than the smallest branch**. Adding a path makes ' +
    'it easier for current to flow, not harder.\n\n' +
    'For two equal resistances the total is exactly half — 10 Ω here. The general formula for two ' +
    'is (R₁ × R₂) ÷ (R₁ + R₂).\n\n' +
    'If you ever calculate a parallel total that is higher than one of the branches, you have made ' +
    'an arithmetic error.',
  source: cite.standard('Parallel resistance'),
  status: 'verified',
});

const noVoltageAnywhere = defineQuestion({
  ...T,
  id: 'hvac.5.2.dead-control-circuit',
  objective: '5.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Nothing in a system operates. You measure 0 V across every device in the 24 V control circuit, ' +
    'including the contactor coil.\n\nWhere do you look?',
  choices: [
    'At the transformer — no secondary voltage means nothing downstream can operate',
    'At the contactor coil, which must be shorted',
    'At the thermostat, which must be stuck closed',
    'At the compressor windings',
  ],
  answer: 0,
  explain:
    'Zero volts across *everything* is different from zero volts across most things. In a working ' +
    'circuit with an open switch, that switch shows full voltage — something has to be dropping ' +
    'it.\n\n' +
    'Nothing anywhere means there is no supply to drop. Check the transformer secondary for 24 V, ' +
    'and its primary for line voltage. Also check any fuse or breaker in the control circuit — many ' +
    'boards have a small automotive-style fuse that opens on a shorted thermostat wire.',
  source: cite.todo('Confirm the control circuit troubleshooting sequence against your text.'),
  status: 'draft',
});

// --- more 5.3 / 5.4 ---------------------------------------------------------

const groundedCompressor = defineQuestion({
  ...T,
  id: 'hvac.5.3.grounded-winding',
  objective: '5.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You measure from a compressor terminal to the shell and read 40 Ω.\n\nWhat does that mean?',
  choices: [
    'The winding is grounded — the compressor is failed and must be replaced',
    'That is normal winding resistance',
    'The compressor needs a new capacitor',
    'The reading is meaningless without the other terminals',
  ],
  answer: 0,
  explain:
    'There should be **no continuity at all** between any terminal and the shell. The windings are ' +
    'insulated from the housing, and a good compressor reads open — effectively infinite ' +
    'resistance.\n\n' +
    'Any measurable resistance to ground means the insulation has broken down. The compressor is ' +
    'failed, and a grounded compressor will keep tripping the breaker.\n\n' +
    'A grounded compressor often also means an acid burnout, so check the oil and fit a suction ' +
    'line drier when replacing it, or the new one will die the same way.',
  source: cite.todo('Confirm compressor testing procedure against your text.'),
  status: 'draft',
});

const dualCapacitorTest = defineQuestion({
  ...T,
  id: 'hvac.5.4.dual-capacitor-halves',
  objective: '5.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A dual run capacitor is marked 45/5 µF. The fan runs but the compressor will not start.\n\n' +
    'How do you test it?',
  choices: [
    'Measure HERM-to-C and FAN-to-C separately — one half can fail while the other tests fine',
    'Measure HERM-to-FAN to get the total',
    'Measure across the whole capacitor and compare to 50 µF',
    'A dual capacitor cannot be tested in place',
  ],
  answer: 0,
  explain:
    'A dual capacitor is two capacitors in one can, sharing a common terminal. The 45 µF section ' +
    '(HERM) serves the compressor and the 5 µF section (FAN) serves the condenser fan.\n\n' +
    'They fail independently. A fan that runs while the compressor will not is a strong hint that ' +
    'the HERM half has gone while the FAN half is fine.\n\n' +
    'Measure each against its rating with a ±6% tolerance. And discharge each half separately ' +
    'before touching it.',
  source: cite.todo('Confirm dual capacitor testing against your text.'),
  status: 'draft',
});

const capacitorTolerance = defineQuestion({
  ...T,
  id: 'hvac.5.4.tolerance-judgement',
  objective: '5.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A 40 µF run capacitor measures 36.5 µF.\n\nWhat is your verdict?',
  choices: [
    'Out of tolerance — 36.5 is about 91% of rating, below the ±6% band. Replace it.',
    'Within tolerance — close enough to 40',
    'Cannot judge without the motor running',
    'Out of tolerance, but only replace it if the motor fails to start',
  ],
  answer: 0,
  explain:
    '36.5 ÷ 40 = 91.25%, which is nearly 9% low. Run capacitors are held to ±6%, so this one is ' +
    'outside the band.\n\n' +
    'The reason not to wait for a hard failure: a weak capacitor does not fail cleanly. The motor ' +
    'still tries to start, draws locked-rotor current, heats up and trips its overload — ' +
    'intermittently. That intermittent hard-starting is hard on the compressor, and the customer ' +
    'experiences it as a system that works some days and not others.',
  source: cite.todo('Confirm run capacitor tolerance against your text.'),
  status: 'draft',
});

// --- more 5.5 / 5.6 / 5.7 ---------------------------------------------------

const contactorChatterCause = defineQuestion({
  ...T,
  id: 'hvac.5.5.chatter-diagnosis',
  objective: '5.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A contactor pulls in and drops out rapidly, over and over.\n\n' +
    'When should you take your voltage reading?',
  choices: [
    'While it is trying to pull in — control voltage sagging under load is the whole diagnosis',
    'With the system off, to get a stable baseline',
    'After it has settled, whichever state that is',
    'At the line side, since that is where the power comes from',
  ],
  answer: 0,
  explain:
    'Chatter means the coil gets just enough voltage to pull in, and then not enough to hold. The ' +
    'fault only exists **under load**.\n\n' +
    'A reading taken with nothing energised will look perfectly fine and tell you nothing. Measure ' +
    'the 24 V while the coil is trying to pull in, and watch it collapse.\n\n' +
    'Causes are an undersized or failing transformer, a poor connection adding resistance, or a ' +
    'shorted coil drawing more than the transformer can supply. Chatter is destructive too — each ' +
    'bounce arcs across the contacts and burns them.',
  source: cite.todo('Confirm the contactor chatter diagnosis against your service text.'),
  status: 'draft',
});

const missingCommon = defineQuestion({
  ...T,
  id: 'hvac.5.5.missing-c-wire',
  objective: '5.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A newly installed Wi-Fi thermostat keeps dropping offline and occasionally reboots itself. The ' +
    'old mechanical thermostat worked fine.\n\nWhat is the likely cause?',
  choices: [
    'No common (C) wire, so the thermostat cannot draw continuous power',
    'The thermostat is faulty and should be replaced',
    'The transformer is undersized for the equipment',
    'The Y wire is loose',
  ],
  answer: 0,
  explain:
    'A mechanical thermostat is just a switch — it needs no power of its own. A smart thermostat ' +
    'needs continuous power for its display, processor and radio, and that requires a return path: ' +
    'the C wire.\n\n' +
    'Without one, some thermostats "power steal" through the load, which works marginally and ' +
    'produces exactly this behaviour — dropping offline, rebooting, sometimes chattering the ' +
    'equipment.\n\n' +
    'The fix is running a C wire, or fitting an add-a-wire adapter. This is one of the most common ' +
    'calls after a customer-installed smart thermostat.',
  source: cite.todo('Confirm the C wire discussion against your text.'),
  status: 'draft',
});

const ladderRungMeaning = defineQuestion({
  ...T,
  id: 'hvac.5.6.what-a-rung-is',
  objective: '5.6',
  kind: 'choice',
  difficulty: 2,
  prompt: 'On a ladder diagram, what does a single rung represent?',
  choices: [
    'One complete circuit: from one power rail, through its controls, through a load, to the other rail',
    'One physical wire in the equipment',
    'One step in the sequence of operation',
    'One component in the cabinet',
  ],
  answer: 0,
  explain:
    'Each rung is a complete circuit path. Reading left to right gives you every condition that has ' +
    'to be satisfied for that load to operate.\n\n' +
    'The convention of putting controls before the load is what makes voltage-drop troubleshooting ' +
    'work: you walk along the rung with a meter, and the point where voltage disappears is the ' +
    'fault.\n\n' +
    'Relay contacts are labelled with the coil that operates them, so a contact marked CR1 is ' +
    'controlled by the CR1 coil elsewhere in the diagram. Following those cross-references is how ' +
    'you trace a sequence.',
  source: cite.todo('Confirm the ladder diagram conventions against your text.'),
  status: 'draft',
});

const neverJumper = defineQuestion({
  ...T,
  id: 'hvac.5.7.never-jumper-a-safety',
  objective: '5.7',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You have found an open high-pressure switch. What should you do next?',
  choices: [
    'Find out why it opened — it is reporting a real condition until proven otherwise',
    'Jumper it out so the system runs, then diagnose',
    'Replace the switch, since an open switch is a failed switch',
    'Reset it and leave, since it may have been a one-off',
  ],
  answer: 0,
  whyWrong: {
    1: 'Jumpering removes the protection that is stopping the system destroying itself.',
    2: 'A switch doing its job is not a failed switch.',
    3: 'A high-pressure trip has a cause, and it will happen again.',
  },
  explain:
    'A safety switch that has opened is telling you something. High pressure means heat is not ' +
    'leaving the condenser: dirty coil, failed fan, overcharge, non-condensables, or blocked ' +
    'airflow.\n\n' +
    'Jumpering it lets the system run past the pressure the switch exists to prevent. That is how ' +
    'compressors get destroyed and, on larger equipment, how relief devices discharge.\n\n' +
    'Diagnose the cause. If everything checks out and the switch still will not close with normal ' +
    'pressures, *then* it is a failed switch.',
  source: cite.todo('Confirm safety control practice against your service text.'),
  status: 'draft',
});

export const SECTOR_5_QUESTIONS: readonly Question[] = [
  ohmsRelationships,
  ohmsCalc,
  seriesParallelBehaviour,
  parallelIntuition,
  openSwitchVoltage,
  noVoltageAnywhere,
  motorTerminals,
  groundedCompressor,
  capacitorRoles,
  dualCapacitorTest,
  capacitorTolerance,
  controlComponents,
  contactorChatterCause,
  thermostatWiring,
  missingCommon,
  ladderReading,
  ladderRungMeaning,
  meterVerification,
  capacitorDischarge,
  neverJumper,
];
