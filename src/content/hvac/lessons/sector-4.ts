import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

/** Sector 4 — Metering Devices & Charging. */

const meteringDevices = defineLesson({
  id: 'hvac.lesson.4.metering',
  track: 'hvac',
  domain: '4.0',
  order: 1,
  title: 'Metering devices, and why the type decides how you charge',
  summary:
    'Fixed orifice, TXV, EEV. The difference is whether the device can respond to load — and that ' +
    'single fact determines your charging method.',
  minutes: 7,
  sections: [
    {
      kind: 'prose',
      body:
        'Every metering device does the same job: drop the pressure so the refrigerant can boil ' +
        'cold. What separates them is whether they can **respond** when conditions change.',
    },
    {
      kind: 'table',
      heading: 'The three you will meet',
      columns: ['Device', 'How it meters', 'Responds to load?', 'Charge by'],
      rows: [
        ['Fixed orifice / piston', 'A hole of a fixed size', 'No', 'Superheat, from the chart'],
        ['Capillary tube', 'A long small-bore tube', 'No', 'Superheat, from the chart'],
        ['TXV', 'Modulates on sensed superheat', 'Yes', 'Subcooling'],
        ['EEV', 'Electronically controlled', 'Yes, fastest', 'Subcooling / manufacturer spec'],
      ],
    },
    {
      kind: 'prose',
      heading: 'How a TXV actually works',
      body:
        'Three forces act on the valve diaphragm.\n\n' +
        'The **sensing bulb**, clamped to the suction line, is the opening force. As the line warms, ' +
        'the charge inside the bulb expands and pushes the valve open to feed more refrigerant.\n\n' +
        '**Evaporator pressure** and the adjustable **superheat spring** both push closed.\n\n' +
        'The valve settles wherever these balance, which is what holds superheat roughly constant ' +
        'across a wide range of conditions.\n\n' +
        'That also explains the classic failure. A bulb that has come loose senses room air instead ' +
        'of the pipe, reads that as "far too warm", and holds the valve wide open — flooding the ' +
        'evaporator and driving superheat toward zero.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'Bulb mounting is not a detail',
      body:
        'Clean contact with the pipe, a proper clamp, insulation over the top of it, and on a ' +
        'horizontal line at the **10 or 2 o\'clock** position.\n\n' +
        'Not the bottom — oil pools there and the bulb would sense the oil rather than the ' +
        'refrigerant. Not the top on larger lines, where vapour stratifies. A sloppily mounted bulb ' +
        'produces a system that hunts and never settles, and it is a genuinely common cause of ' +
        '"the TXV is bad" diagnoses on valves that are perfectly fine.',
    },
  ],
  source: cite.todo('Confirm the metering device comparison and TXV force balance against your text.'),
  status: 'draft',
}) satisfies Lesson;

const charging = defineLesson({
  id: 'hvac.lesson.4.charging',
  track: 'hvac',
  domain: '4.0',
  order: 2,
  title: 'Putting the right amount in',
  summary: 'Three methods, when each applies, and how to read the result.',
  minutes: 8,
  sections: [
    {
      kind: 'prose',
      body:
        'There are three ways to charge a system, and they are not equally good. In order of ' +
        'accuracy:\n\n' +
        '**Weigh it in.** Recover, evacuate, and weigh in the nameplate charge adjusted for line ' +
        'set length. This is the most accurate method available and the right answer after any ' +
        'repair where the system was opened. Superheat and subcooling then *confirm* the result ' +
        'rather than establishing it.\n\n' +
        '**Subcooling**, for a TXV system.\n\n' +
        '**Superheat**, for a fixed orifice, from the manufacturer\'s chart.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: weighing in with a long line set',
      problem:
        'A condenser nameplate reads:\n' +
        '  "Factory charge 8 lb 4 oz, for 15 ft of line set.\n' +
        '   Add 0.6 oz per foot over 15 ft."\n\n' +
        'The installed line set is 40 ft. What total charge do you weigh in?',
      steps: [
        {
          action: 'Find how much line is beyond what the factory charge covers.',
          result: '40 − 15 = 25 ft of extra line',
        },
        {
          action: 'Multiply by the per-foot adjustment.',
          result: '25 × 0.6 = 15 oz',
        },
        {
          action: 'Add to the factory charge.',
          result: '8 lb 4 oz + 15 oz = 8 lb 19 oz',
        },
        {
          action: 'Convert to pounds and ounces properly — 16 oz to the pound.',
          result: '19 oz = 1 lb 3 oz, so 8 lb + 1 lb 3 oz',
        },
      ],
      answer: '9 lb 3 oz',
      moral:
        'The line-set adjustment is not optional on a long run. A 40 ft line set holds meaningfully ' +
        'more refrigerant than a 15 ft one, and charging to the bare nameplate figure leaves the ' +
        'system undercharged — which you would then chase as a leak.',
    },
    {
      kind: 'prose',
      heading: 'Charging a fixed orifice by superheat',
      body:
        'A fixed orifice cannot respond to anything, so superheat is the only reading that tells ' +
        'you about the charge. The manufacturer\'s chart gives you a target from two measurements:\n\n' +
        '**Indoor wet bulb** at the return, and **outdoor dry bulb**.\n\n' +
        'Indoor WET bulb specifically, not dry bulb. The coil\'s job includes removing moisture, and ' +
        'wet bulb captures the total heat content of the entering air. Using dry bulb gives the ' +
        'wrong target, often badly.\n\n' +
        'Target superheat rises as the indoor load rises and falls as it gets hotter outside. Then ' +
        'you add or remove refrigerant until measured superheat matches the target.',
    },
    {
      kind: 'table',
      heading: 'Reading the result',
      columns: ['Superheat', 'Subcooling', 'Diagnosis', 'Action'],
      rows: [
        ['HIGH', 'LOW', 'Undercharge', 'Find the leak first, then weigh in'],
        ['HIGH', 'HIGH', 'Restriction', 'Do NOT add refrigerant — find the blockage'],
        ['LOW', 'HIGH', 'Overcharge', 'Recover to correct subcooling'],
        ['LOW', 'LOW', 'Overfeeding valve', 'Check the TXV bulb mounting'],
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'Refrigerant is not consumed',
      body:
        'It runs in a sealed loop. If a system is low, it **leaked**, and adding more without ' +
        'finding the leak means being back next season with the customer paying twice.\n\n' +
        'The opposite mistake is just as common: topping up a correctly charged system because "the ' +
        'suction pressure looked a bit low". Suction pressure varies with indoor load, airflow and ' +
        'ambient. Adding refrigerant on one gauge reading, without superheat and subcooling, is how ' +
        'good systems end up overcharged and damaged.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'What an overcharge actually does',
      body:
        'Excess refrigerant floods the lower condenser rows, reducing the surface available for ' +
        'condensing. Head pressure rises, compression ratio rises, amps rise, and capacity **falls** ' +
        '— the opposite of the intent.\n\n' +
        'Push it far enough and liquid reaches the compressor. Residential split systems have no ' +
        'relief valve to vent the excess for you.',
    },
  ],
  source: cite.todo('Confirm the charging procedures against your text and a manufacturer charging chart.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_4_LESSONS: readonly Lesson[] = [meteringDevices, charging];
