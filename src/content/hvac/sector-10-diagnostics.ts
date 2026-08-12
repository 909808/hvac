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

// --- more 10.2 --------------------------------------------------------------

const highSuperheatAmbiguous = defineQuestion({
  ...T,
  id: 'hvac.10.2.superheat-alone-ambiguous',
  objective: '10.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Superheat measures 28°F on a system that should be running 10°F.\n\n' +
    'What can you conclude from that reading alone?',
  choices: [
    'Only that the evaporator is starving — subcooling is needed to say why',
    'The system is undercharged',
    'There is a restriction in the liquid line',
    'The metering device has failed',
  ],
  answer: 0,
  explain:
    'High superheat says the coil ran out of liquid early. It does **not** say why.\n\n' +
    'An undercharge starves the coil because there is not enough refrigerant in the system. A ' +
    'restriction starves it because refrigerant cannot get through. Both give high superheat.\n\n' +
    'Subcooling separates them:\n' +
    '**LOW subcooling** → not enough refrigerant anywhere → undercharge.\n' +
    '**HIGH subcooling** → refrigerant backing up behind a blockage → restriction.\n\n' +
    'Acting on superheat alone is how a technician adds refrigerant to a restricted system, making ' +
    'it worse and leaving it overcharged once the restriction is finally found.',
  source: cite.todo('Confirm the superheat/subcooling pairing against your service text.'),
  status: 'draft',
});

const highHeadCleanCoil = defineQuestion({
  ...T,
  id: 'hvac.10.2.high-split-clean-coil',
  objective: '10.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Condenser split is 38°F on a standard-efficiency unit. The coil is clean, the fan runs well, ' +
    'and there is nothing blocking airflow. The system was repaired six weeks ago.\n\n' +
    'What fits?',
  choices: [
    'Non-condensables — air left in the system because it was not properly evacuated',
    'A dirty condenser coil that you have missed',
    'An undercharge',
    'Low indoor airflow',
  ],
  answer: 0,
  explain:
    'The **contradiction** is the diagnosis. A high split says heat is not leaving the condenser, ' +
    'but a clean coil with a working fan says there is no physical reason for that.\n\n' +
    'Air trapped in the system occupies condenser volume and adds its own partial pressure on top ' +
    'of the refrigerant\'s. Head pressure reads higher than the refrigerant temperature alone ' +
    'accounts for.\n\n' +
    'That it followed a repair points straight at evacuation. Air does not come out on its own — ' +
    'only a deep vacuum removes it, which is why 500 microns and a decay test exist.\n\n' +
    'There is no way to bleed it out selectively. Recover, evacuate properly, weigh in a fresh charge.',
  source: cite.todo('Confirm the non-condensable diagnosis against your service text.'),
  status: 'draft',
});

// --- more 10.3 --------------------------------------------------------------

const deltaTHighMeaning = defineQuestion({
  ...T,
  id: 'hvac.10.3.high-delta-t-meaning',
  objective: '10.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Return air is 76°F, supply air is 48°F — a 28°F drop, well above the expected range.\n\n' +
    'What does that point to?',
  choices: [
    'Low airflow — less air passing over the coil spends longer against it and drops further',
    'An overcharge',
    'A dirty condenser coil',
    'The system is working better than expected',
  ],
  answer: 0,
  whyWrong: {
    1: 'An overcharge reduces capacity and gives a LOWER drop.',
    2: 'A dirty condenser affects the high side and gives a lower drop, not a higher one.',
    3: 'A large drop with low total airflow means less total heat moved, not more.',
  },
  explain:
    'It is tempting to read a big temperature drop as good performance. It is not — it means very ' +
    'little air is getting through.\n\n' +
    'Capacity is CFM × ΔT. Halve the airflow and the drop rises, but the product falls: less total ' +
    'heat is being moved and the house does not cool.\n\n' +
    'A 28°F drop is also close to freezing the coil, which is where this ends if it is left. Check ' +
    'the filter, the blower wheel, the coil face and duct static pressure.',
  source: cite.todo('Confirm the delta-T interpretation against your service text.'),
  status: 'draft',
});

const bothLowSuction = defineQuestion({
  ...T,
  id: 'hvac.10.3.order-of-checks',
  objective: '10.3',
  kind: 'order',
  difficulty: 2,
  prompt:
    'Suction pressure is low. Put these checks in the order that gets you an answer fastest.',
  steps: [
    'Look at the filter and the coil face — free, and airflow is the most common cause',
    'Measure return and supply air temperature to get the delta-T',
    'Judge the delta-T against the entering wet bulb to separate airflow from charge',
    'If it points at the refrigerant side, measure liquid line temperature for subcooling',
    'Use superheat and subcooling together to separate an undercharge from a restriction',
  ],
  explain:
    'Order the checks by information gained per minute spent. Visual first, air side second, ' +
    'refrigerant side last.\n\n' +
    'A loaded filter settles it in ten seconds. A delta-T reading takes two minutes and eliminates ' +
    'half the possibilities. Only then is it worth doing the refrigerant-side arithmetic.\n\n' +
    'Reaching for the gauges first is the habit worth breaking — it is slower, it costs a little ' +
    'refrigerant every time, and it answers a question you may not need to ask.',
  source: cite.todo('Confirm the diagnostic sequence against your service text.'),
  status: 'draft',
});

// --- more 10.4 --------------------------------------------------------------

const compressorNotRunning = defineQuestion({
  ...T,
  id: 'hvac.10.4.nothing-happens',
  objective: '10.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'The thermostat calls for cooling. The indoor blower runs but the outdoor unit is completely ' +
    'silent — no hum, no fan.\n\nWhere do you start?',
  choices: [
    'Check for 24 V at the contactor coil, which tells you whether the fault is in the control circuit or the load side',
    'Connect gauges to check the refrigerant charge',
    'Replace the run capacitor',
    'Check the compressor windings',
  ],
  answer: 0,
  explain:
    'Complete silence means the contactor is not pulling in, or it is pulling in and there is no ' +
    'power beyond it. One measurement splits the problem in half.\n\n' +
    '**24 V present at the coil but the contactor is not closing** → the contactor itself, or its ' +
    'coil, has failed.\n\n' +
    '**No 24 V at the coil** → work back up the control circuit: thermostat, safety switches, ' +
    'transformer, control fuse.\n\n' +
    'A humming compressor would be a different fault entirely — that is a locked rotor, and the ' +
    'capacitor becomes the first suspect. Silence and humming point in opposite directions.',
  source: cite.todo('Confirm the no-operation diagnostic sequence against your service text.'),
  status: 'draft',
});

const breakerTrips = defineQuestion({
  ...T,
  id: 'hvac.10.4.breaker-trips-immediately',
  objective: '10.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A breaker trips the instant the outdoor unit is energised, before the compressor even attempts ' +
    'to start.\n\nWhat does the timing tell you?',
  choices: [
    'A direct short or a grounded winding — an overload from a hard start would take seconds, not instants',
    'A weak run capacitor',
    'An overcharge raising the amp draw',
    'A dirty condenser coil',
  ],
  answer: 0,
  explain:
    'Timing is the diagnostic here.\n\n' +
    '**Instant trip** → a short circuit or a ground fault. Current is not limited by anything, so ' +
    'the magnetic trip acts immediately. Check terminal-to-shell continuity on the compressor and ' +
    'look for damaged wiring.\n\n' +
    '**Trips after several seconds** → an overload condition. The thermal element takes time to ' +
    'respond. That is a locked rotor, a weak capacitor, or genuinely excessive running current.\n\n' +
    'The other options all raise current gradually and would trip on the thermal element, not ' +
    'instantly.',
  source: cite.todo('Confirm the breaker trip discussion against your service text.'),
  status: 'draft',
});

// --- more 10.1 / 10.5 -------------------------------------------------------

const customerInterview = defineQuestion({
  ...T,
  id: 'hvac.10.1.ask-the-customer',
  objective: '10.1',
  kind: 'multi',
  difficulty: 2,
  prompt:
    'Which questions to the customer genuinely narrow the diagnosis before you touch anything? ' +
    'Select all that apply.',
  choices: [
    'When did it start, and did anything change around then?',
    'Is it constant, or worse at certain times of day?',
    'Has anyone else worked on it recently?',
    'What temperature do you keep it at in winter?',
  ],
  answers: [0, 1, 2],
  explain:
    'The first three are free information that eliminates whole families of cause.\n\n' +
    '"It started after the storm" suggests electrical damage. "Only in the afternoon" suggests ' +
    'something load- or heat-related — a marginal capacitor, a condenser that cannot cope on a hot ' +
    'day. "Someone was out last month" raises non-condensables, a wrong charge, or a part fitted ' +
    'incorrectly.\n\n' +
    'The winter setpoint tells you nothing about a summer cooling fault. The skill is asking ' +
    'questions whose answers change what you do next.',
  source: cite.todo('Confirm the customer interview discussion against your service text.'),
  status: 'draft',
});

const baselineValue = defineQuestion({
  ...T,
  id: 'hvac.10.5.trend-detection',
  objective: '10.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Last year\'s maintenance record shows subcooling at 10°F. This year it reads 6°F, still within ' +
    'the acceptance band.\n\nWhat should you do?',
  choices: [
    'Investigate — a downward trend in subcooling suggests a developing leak, even though the reading still passes',
    'Nothing, since 6°F is within tolerance',
    'Add refrigerant to bring it back to 10°F',
    'Note it and check again next year',
  ],
  answer: 0,
  explain:
    'A single reading tells you whether a system is inside its bands. Two readings a year apart tell ' +
    'you which **direction** it is heading, and that is far more useful.\n\n' +
    'Subcooling drifting from 10°F to 6°F is refrigerant leaving the system. It still passes today, ' +
    'and it will not pass in August when the customer needs it most.\n\n' +
    'Adding refrigerant without finding the leak treats the number instead of the cause — and puts ' +
    'you back next season. This is exactly what documentation is for.',
  source: cite.todo('Confirm the trend analysis discussion against your service text.'),
  status: 'draft',
});

export const SECTOR_10_QUESTIONS: readonly Question[] = [
  troubleshootingOrder,
  lookFirst,
  customerInterview,
  bothPressures,
  highSuperheatAmbiguous,
  highHeadCleanCoil,
  airflowVsCharge,
  deltaTMisread,
  deltaTHighMeaning,
  bothLowSuction,
  compressorNotStarting,
  compressorNotRunning,
  breakerTrips,
  contactorChatter,
  documentReadings,
  baselineValue,
  callbackPrevention,
];
