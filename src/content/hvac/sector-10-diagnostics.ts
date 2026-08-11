import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Sector 10 — Diagnostics & Service.
 *
 * Where the rest of it gets used. The Service Call simulator is the practical
 * half of this sector; these questions are the reasoning behind it.
 */

const T = { track: 'hvac', domain: '10.0' } as const;

// --- 10.1 Method ------------------------------------------------------------------

const troubleshootingOrder = defineQuestion({
  ...T,
  id: 'hvac.10.1.method-order',
  objective: '10.1',
  kind: 'order',
  difficulty: 2,
  prompt: 'Put a systematic troubleshooting approach in order.',
  steps: [
    'Talk to the customer — what is it doing, when did it start, what changed',
    'Observe the system running and look before reaching for instruments',
    'Form a theory about what would produce these symptoms',
    'Take the measurements that would confirm or eliminate that theory',
    'Confirm the root cause, not just the symptom',
    'Repair, then verify the system operates correctly across a full cycle',
    'Document the readings and what was done',
  ],
  explain:
    'The two steps most often skipped are the first and the second to last.\n\n' +
    'The customer interview is free information: "it started after the storm", "it only does it in ' +
    'the afternoon", "someone was out last month" each narrow the field enormously before you ' +
    'touch anything.\n\n' +
    'Confirming the root cause rather than the symptom is what separates a repair from a ' +
    'callback. Replacing a contactor with burnt contacts fixes today; finding out the compressor ' +
    'is drawing locked-rotor current because its capacitor is weak fixes it properly.',
  source: cite.todo('Confirm against the troubleshooting chapter of your service text.'),
  status: 'draft',
});

const lookFirst = defineQuestion({
  ...T,
  id: 'hvac.10.1.cheap-checks-first',
  objective: '10.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You arrive at a no-cooling call. What is the most efficient first move?',
  choices: [
    'Look at the filter, the coil, the outdoor fan and the thermostat setting before connecting anything',
    'Connect gauges immediately to see the pressures',
    'Assume low charge and start a leak search',
    'Replace the capacitor as a precaution',
  ],
  answer: 0,
  explain:
    'Visual checks cost seconds and settle a surprising share of calls outright. A filter you ' +
    'cannot see light through, a stationary outdoor fan, a thermostat in the wrong mode — none of ' +
    'these need a gauge, and all of them are common.\n\n' +
    'Connecting gauges is not free. It takes time, it releases a little refrigerant every time you ' +
    'connect and disconnect, and it can introduce air or contamination. Do it when you have a ' +
    'refrigerant-side question that needs answering, not as a reflex.\n\n' +
    'The general principle: order your checks by information gained per minute spent. That almost ' +
    'always puts your eyes first.',
  source: cite.todo('Confirm against your service text.'),
  status: 'draft',
});

// --- 10.2 Reading the gauges as a set -----------------------------------------------

const bothPressures = defineQuestion({
  ...T,
  id: 'hvac.10.2.pressures-converging',
  objective: '10.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'On a running system, suction pressure is unusually HIGH and head pressure is unusually LOW. ' +
    'Compressor amps are well below rated load.\n\nWhat does this indicate?',
  choices: [
    'The compressor is not pumping — most likely internal valve failure',
    'The system is overcharged',
    'The condenser coil is dirty',
    'The evaporator is starved of airflow',
  ],
  whyWrong: {
    1: 'An overcharge pushes head pressure UP and amps up, not down.',
    2: 'A dirty condenser raises head pressure.',
    3: 'Low airflow lowers suction pressure rather than raising it.',
  },
  answer: 0,
  explain:
    'Almost every fault pushes the two pressures further apart. A compressor that has stopped ' +
    'pumping is the one that brings them together: suction rises because nothing is drawing vapour ' +
    'away, head falls because nothing is being delivered.\n\n' +
    'Low amps confirm it. A compressor doing no work draws little current — this is the fault ' +
    'where the motor is running fine and the pump is not.\n\n' +
    'The wider lesson is that a single pressure means very little. Suction pressure alone is ' +
    'consistent with a dozen conditions; suction together with head, amps and superheat is often ' +
    'consistent with only one.',
  source: cite.todo('Confirm the compressor failure signature against your service text.'),
  status: 'draft',
});

// --- 10.3 Airflow versus charge ------------------------------------------------------

const airflowVsCharge = defineQuestion({
  ...T,
  id: 'hvac.10.3.low-suction-two-causes',
  objective: '10.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Suction pressure is low. Which single additional measurement most efficiently separates a ' +
    'low charge from a low-airflow problem?',
  choices: [
    'The air temperature drop across the evaporator coil',
    'Outdoor ambient temperature',
    'Compressor amps',
    'Line voltage',
  ],
  answer: 0,
  explain:
    'Both faults drop suction pressure, so the gauge alone cannot separate them. The air side can, ' +
    'and it moves in opposite directions:\n\n' +
    'Low charge → less refrigerant to absorb heat → the air gives up less heat → temperature drop ' +
    'is LOW, often under 15°F.\n\n' +
    'Low airflow → the air that does get through spends longer against a colder coil → temperature ' +
    'drop is HIGH, often over 25°F.\n\n' +
    'One thermometer reading at the return and one at the supply settles it. This is the single ' +
    'highest-value cross-check in cooling diagnosis, and it costs about two minutes.',
  source: cite.todo('Confirm the airflow-versus-charge discussion against your service text.'),
  status: 'draft',
});

const deltaTMisread = defineQuestion({
  ...T,
  id: 'hvac.10.3.delta-t-humidity',
  objective: '10.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system in a humid climate shows a 16°F temperature drop across the coil. Charge and static ' +
    'pressure both check out.\n\nHow should you read that?',
  choices: [
    'Likely normal — high indoor humidity means more capacity goes to latent removal, which lowers the temperature drop',
    'Definitely low airflow, since the target is always 20°F',
    'Definitely low charge',
    'The coil must be dirty',
  ],
  answer: 0,
  explain:
    'Temperature drop is not a fixed target. The band depends on the moisture in the entering air, ' +
    'because a coil doing latent work is spending capacity on condensing water rather than on ' +
    'lowering temperature.\n\n' +
    'Roughly: 16–18°F is expected at a high entering wet bulb, and 22–24°F at a low one. Quoting ' +
    '"20 degrees" as a universal target produces false diagnoses in both directions — chasing a ' +
    'non-existent airflow fault in Houston, and missing a real one in Phoenix.\n\n' +
    'Measure the entering wet bulb and judge the drop against it. That is why a psychrometer ' +
    'belongs in the bag alongside the thermometer.',
  source: cite.todo('Confirm the delta-T versus wet bulb relationship against your service text.'),
  status: 'draft',
});

// --- 10.4 Electrical failures --------------------------------------------------------

const compressorNotStarting = defineQuestion({
  ...T,
  id: 'hvac.10.4.hums-and-trips',
  objective: '10.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A compressor hums for a few seconds, draws very high current, and then trips its overload. ' +
    'It has correct line voltage at the contactor.\n\nWhat is the most likely cause?',
  choices: [
    'A failed run capacitor, or a mechanically seized compressor',
    'Low refrigerant charge',
    'A dirty air filter',
    'A failed thermostat',
  ],
  answer: 0,
  explain:
    'Humming with very high current is locked rotor: the motor is energised and not turning. With ' +
    'good voltage at the terminals, the two candidates are that it cannot produce starting torque, ' +
    'or that it physically cannot turn.\n\n' +
    'Test the run capacitor first — it is cheap, quick, and by far the more common of the two. A ' +
    'capacitor that has drifted out of its ±6% tolerance robs the motor of starting torque without ' +
    'failing outright.\n\n' +
    'If the capacitor is good, a hard-start kit will tell you more: if it starts with one, the ' +
    'compressor is weak but alive. If it still will not turn, it is seized and needs replacing.\n\n' +
    'Neither charge nor airflow can cause this. Both affect how well a running compressor performs, ' +
    'not whether it can start.',
  source: cite.todo('Confirm the locked-rotor diagnosis against your service text.'),
  status: 'draft',
});

const contactorChatter = defineQuestion({
  ...T,
  id: 'hvac.10.4.contactor-chatter',
  objective: '10.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A contactor is chattering — pulling in and dropping out rapidly. What should you check?',
  choices: [
    'The 24 V control voltage under load, and the transformer\'s capacity to hold it',
    'The refrigerant charge',
    'The evaporator coil for ice',
    'The condensate drain',
  ],
  answer: 0,
  explain:
    'Chattering means the coil is repeatedly getting just enough voltage to pull in and then not ' +
    'enough to hold. The classic cause is control voltage sagging under load — an undersized or ' +
    'failing transformer, a poor connection adding resistance, or a shorted coil drawing more than ' +
    'the transformer can supply.\n\n' +
    'Measure the 24 V while it is trying to pull in, not at rest. A reading that looks fine with ' +
    'nothing energised and collapses under load is the whole diagnosis.\n\n' +
    'Chatter is destructive, not merely annoying: each bounce arcs across the contacts and burns ' +
    'them, so a control-circuit problem left alone becomes a contactor replacement as well.',
  source: cite.todo('Confirm the contactor chatter diagnosis against your service text.'),
  status: 'draft',
});

// --- 10.5 Documentation ---------------------------------------------------------------

const documentReadings = defineQuestion({
  ...T,
  id: 'hvac.10.5.why-document',
  objective: '10.5',
  kind: 'choice',
  difficulty: 1,
  prompt: 'Why record the full set of readings on every call, including on a routine maintenance visit?',
  choices: [
    'They become the baseline that makes the next visit\'s readings meaningful',
    'Only for billing purposes',
    'Because it is legally required in all jurisdictions',
    'To make the invoice look more substantial',
  ],
  answer: 0,
  explain:
    'A single set of readings tells you whether the system is inside its acceptance bands. Two ' +
    'sets, a year apart, tell you which direction it is heading — and that is far more useful.\n\n' +
    'Subcooling that has drifted from 10°F to 6°F over a season is a leak you can catch before the ' +
    'customer loses cooling in August. Amps creeping up year over year is a compressor going. ' +
    'Neither is visible from one visit.\n\n' +
    'It also protects you. When somebody claims a system was fine before you touched it, a ' +
    'documented set of readings from the day you arrived is the answer.',
  source: cite.todo('Confirm against your service text.'),
  status: 'draft',
});

const callbackPrevention = defineQuestion({
  ...T,
  id: 'hvac.10.5.verify-before-leaving',
  objective: '10.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You have replaced a failed run capacitor and the system is now running.\n\n' +
    'What should you do before leaving?',
  choices: [
    'Let it run to steady state, take a full set of readings, and confirm why the capacitor failed',
    'Pack up as soon as the compressor starts — the fault is fixed',
    'Add refrigerant as a precaution while the gauges are connected',
    'Recommend a full system replacement',
  ],
  answer: 0,
  explain:
    'A system that starts is not the same as a system that is working. Readings taken in the first ' +
    'minute are still stabilising; give it ten to fifteen minutes and take a full set.\n\n' +
    'Then ask why the capacitor failed. Age is a legitimate answer. So is heat — a capacitor ' +
    'cooking next to a condenser running high head pressure will fail again in a year, and the ' +
    'high head pressure is the real fault. Replacing the symptom and leaving the cause is what ' +
    'produces callbacks.\n\n' +
    'Adding refrigerant "while you are there" to a system that did not need it is the single most ' +
    'common way a repair visit makes a system worse.',
  source: cite.todo('Confirm against your service text.'),
  status: 'draft',
});

export const SECTOR_10_QUESTIONS: readonly Question[] = [
  troubleshootingOrder,
  lookFirst,
  bothPressures,
  airflowVsCharge,
  deltaTMisread,
  compressorNotStarting,
  contactorChatter,
  documentReadings,
  callbackPrevention,
];
