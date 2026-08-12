import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

/** Sector 10 — Diagnostics & Service. */

const diagnostics = defineLesson({
  id: 'hvac.lesson.10.method',
  track: 'hvac',
  domain: '10.0',
  order: 1,
  title: 'Working a call instead of guessing',
  summary:
    'Everything so far, applied. The skill is choosing which three readings settle it — not taking ' +
    'all thirteen.',
  minutes: 9,
  sections: [
    {
      kind: 'prose',
      body:
        'Troubleshooting is not a mystery. It is a loop: observe, form a theory, take the reading ' +
        'that would confirm or kill it, repeat.\n\n' +
        'What separates a good technician from a parts-changer is **which reading they take next**. ' +
        'Everyone can measure everything eventually. The skill is knowing that a filter inspection ' +
        'and a temperature drop will settle this particular call in four minutes.',
    },
    {
      kind: 'prose',
      heading: 'Order your checks by information per minute',
      body:
        'Visual checks cost seconds and settle a surprising share of calls outright. A filter you ' +
        'cannot see light through. A stationary outdoor fan. A thermostat in the wrong mode. None of ' +
        'these need a gauge.\n\n' +
        'Connecting gauges is **not free**. It takes time, it releases a little refrigerant every ' +
        'time you connect and disconnect, and it can introduce air or contamination. Do it when you ' +
        'have a refrigerant-side question that needs answering — not as a reflex.\n\n' +
        'And talk to the customer first. "It started after the storm", "only in the afternoon", ' +
        '"someone was out last month" each narrow the field enormously, and cost nothing.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'The single highest-value cross-check',
      body:
        'Suction pressure is low. That is consistent with a **low charge** and with **low airflow**, ' +
        'and the gauges cannot tell them apart.\n\n' +
        'The air-side temperature drop can, and it moves in opposite directions:\n\n' +
        '**Low charge** → less refrigerant to absorb heat → the air gives up less → drop is **LOW**, ' +
        'often under 15°F.\n\n' +
        '**Low airflow** → the air that does get through spends longer against a colder coil → drop ' +
        'is **HIGH**, often over 25°F.\n\n' +
        'One thermometer at the return, one at the supply. Two minutes, and it eliminates half the ' +
        'possibilities.',
    },
    {
      kind: 'table',
      heading: 'The full signature table',
      columns: ['Fault', 'Suction', 'Head', 'Superheat', 'Subcool', 'Amps', 'Air ΔT'],
      rows: [
        ['Undercharge', 'low', 'low', 'HIGH', 'LOW', 'low', 'low'],
        ['Restriction', 'low', 'low-norm', 'HIGH', 'HIGH', 'low', 'low'],
        ['Overcharge', 'high', 'high', 'low', 'HIGH', 'high', 'low'],
        ['Dirty condenser', 'high', 'HIGH', 'normal', 'norm-high', 'high', 'low'],
        ['Condenser fan out', 'high', 'V.HIGH', 'normal', 'high', 'high', 'low'],
        ['Low evap airflow', 'low', 'low', 'low', 'norm-high', 'low', 'HIGH'],
        ['Bad compressor', 'HIGH', 'LOW', 'high', 'low', 'LOW', 'low'],
        ['Non-condensables', 'normal', 'high', 'normal', 'high', 'high', 'low'],
        ['TXV overfeeding', 'high', 'normal', '≈ZERO', 'low', 'high', 'low'],
      ],
      note:
        'Read across, not down. No single column identifies a fault; the pattern across the row does.',
    },
    {
      kind: 'prose',
      heading: 'Three patterns worth memorising',
      body:
        '**Pressures converging** — suction high AND head low — is the compressor not pumping. ' +
        'Nearly every other fault pushes the two pressures apart. Confirm with amps well below RLA.\n\n' +
        '**High superheat** is ambiguous by itself; subcooling resolves it. Low subcooling means ' +
        'undercharge, high subcooling means restriction.\n\n' +
        '**High condenser split with a clean coil** is non-condensables, especially after a recent ' +
        'repair. The contradiction is the clue: heat is not leaving, but there is no physical reason ' +
        'for that.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: reasoning through a call',
      problem:
        'Complaint: "not cooling well, has been getting worse for two weeks."\n\n' +
        'You look first: filter is clean, condenser coil is clean, outdoor fan running.\n' +
        'Gauges: suction low, head low.\n' +
        'Air: return 76°F, supply 64°F.\n\n' +
        'What is it, and what one more reading would confirm it?',
      steps: [
        {
          action: 'Compute the temperature drop and judge it.',
          result: '76 − 64 = 12°F. That is LOW — expect around 20°F.',
        },
        {
          action: 'Low suction with a LOW temperature drop. Use the cross-check.',
          result: 'Rules OUT low airflow, which would give a HIGH drop. Points at the refrigerant side.',
        },
        {
          action: 'Low suction and low head together, with a clean condenser. Narrow the candidates.',
          result: 'Undercharge or restriction — both starve the evaporator.',
        },
        {
          action: 'Recall what separates those two.',
          result: 'Subcooling. Undercharge → LOW. Restriction → HIGH.',
        },
        {
          action: 'Note the timeline too. "Getting worse over two weeks" fits a developing leak better than a sudden blockage.',
          result: 'Leans undercharge, but subcooling decides it.',
        },
      ],
      answer:
        'Take liquid line temperature and compute subcooling. Low subcooling → undercharge, find the ' +
        'leak. High subcooling → restriction, do not add refrigerant.',
      moral:
        'Five readings and two calculations. No parts guessed at. Note also that the visual checks ' +
        'at the start eliminated three faults before the gauges came out of the van.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Fix the cause, not the symptom',
      body:
        'A contactor with burnt contacts is a symptom. Find out *why* — a compressor drawing ' +
        'locked-rotor current because its capacitor is weak — or you will be back.\n\n' +
        'A capacitor that failed from heat, next to a condenser running high head pressure, will ' +
        'fail again in a year. The high head pressure is the real fault.\n\n' +
        'And never add refrigerant "while you are there" to a system that did not need it. That is ' +
        'the single most common way a repair visit makes a system worse.',
    },
    {
      kind: 'prose',
      heading: 'Document, every time',
      body:
        'One set of readings tells you whether a system is within its bands. Two sets, a year apart, ' +
        'tell you which **direction** it is heading — which is far more useful.\n\n' +
        'Subcooling drifting from 10°F to 6°F over a season is a leak you can catch before the ' +
        'customer loses cooling in August. Amps creeping up year over year is a compressor going. ' +
        'Neither is visible from a single visit.\n\n' +
        'It also protects you. When somebody claims a system was fine before you touched it, a ' +
        'documented set of readings from the day you arrived is the answer.',
    },
  ],
  source: cite.todo('Confirm the diagnostic method and signature table against your service text.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_10_LESSONS: readonly Lesson[] = [diagnostics];
