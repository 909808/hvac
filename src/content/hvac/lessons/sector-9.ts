import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';
import type { Topology } from '@engine/types';

/** Sector 9 — Heat Pumps. */

const heatingMode: Topology = {
  caption: 'Heating mode: the reversing valve has swapped which coil gets the hot gas',
  nodes: [
    { id: 'comp', kind: 'compressor', label: 'Compressor', col: 0, row: 1 },
    { id: 'rv', kind: 'metering', label: 'Reversing valve', col: 1, row: 1 },
    { id: 'indoor', kind: 'condenser', label: 'Indoor coil', sublabel: 'CONDENSER now', col: 2, row: 0 },
    { id: 'outdoor', kind: 'evaporator', label: 'Outdoor coil', sublabel: 'EVAPORATOR now', col: 2, row: 2 },
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

const heatPumps = defineLesson({
  id: 'hvac.lesson.9.heatpumps',
  track: 'hvac',
  domain: '9.0',
  order: 1,
  title: 'One system, running the cycle both ways',
  summary:
    'A heat pump is an air conditioner with a valve that swaps the coils. Everything odd about ' +
    'them follows from that.',
  minutes: 7,
  sections: [
    {
      kind: 'prose',
      body:
        'A heat pump is the same vapour-compression cycle you already know, plus a **reversing ' +
        'valve** that changes which coil receives the hot discharge gas.\n\n' +
        'In cooling, the indoor coil evaporates and the outdoor coil condenses — an ordinary air ' +
        'conditioner. In heating, the valve swaps them: the indoor coil condenses, rejecting heat ' +
        'into the house, while the outdoor coil evaporates, absorbing heat from outdoor air.\n\n' +
        'This is why heat pump literature says "indoor coil" and "outdoor coil" instead of ' +
        '"evaporator" and "condenser". Those words describe what a coil is *doing right now*, not ' +
        'where it is mounted.',
    },
    {
      kind: 'diagram',
      topology: heatingMode,
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'How does a cold coil absorb heat from cold air?',
      body:
        'It sounds impossible that a coil outdoors in 30°F weather absorbs heat from 30°F air. But ' +
        'heat only has to move from warmer to cooler — and the refrigerant inside is boiling at ' +
        'perhaps 15°F.\n\n' +
        'Relative to 15°F refrigerant, 30°F air is a heat source. There is plenty of heat in cold ' +
        'air; you just need something colder to move it into.\n\n' +
        'Capacity falls as it gets colder outside because that temperature difference shrinks. That ' +
        'is the whole reason a balance point exists.',
    },
    {
      kind: 'prose',
      heading: 'Defrost',
      body:
        'In heating, the outdoor coil runs below freezing and accumulates frost, which blocks ' +
        'airflow and kills capacity. Defrost clears it — using the system itself.\n\n' +
        'The unit **switches to cooling**, sending hot discharge gas to the outdoor coil, which melts ' +
        'the frost from the inside out. The **outdoor fan stops**, so cold air is not blowing across ' +
        'the coil it is trying to warm.\n\n' +
        'But the indoor coil is now absorbing heat — cooling the house. So **auxiliary heat runs** ' +
        'during defrost to temper the supply air.\n\n' +
        'Steam rising off an outdoor unit in winter is normal defrost, not a fault. What is worth ' +
        'investigating is a unit defrosting far too often, or one that never does and ices solid.',
    },
    {
      kind: 'table',
      heading: 'Auxiliary versus emergency heat',
      columns: ['', 'Auxiliary heat', 'Emergency heat'],
      rows: [
        ['Compressor', 'Still running', 'Locked off'],
        ['When', 'Automatic, when the heat pump cannot keep up', 'Manual selection'],
        ['Purpose', 'Makes up the shortfall on a cold day', 'For when the heat pump has failed'],
        ['Cost', 'Moderate — supplementing', 'High — resistance heat only'],
      ],
      note:
        'A customer who left the thermostat in emergency heat all winter and then complains about ' +
        'the bill is a genuinely common call.',
    },
    {
      kind: 'prose',
      heading: 'Balance point',
      body:
        'Two lines cross. Building heat loss **rises** as it gets colder outside. Heat pump capacity ' +
        '**falls**, because the outdoor coil has less temperature difference to work with.\n\n' +
        'Where they meet is the **balance point** — the outdoor temperature at which the heat pump ' +
        'exactly meets the load.\n\n' +
        'Below it, auxiliary heat has to make up the difference. Above it, the heat pump alone is ' +
        'enough and any aux operation is waste.\n\n' +
        'A typical residential balance point falls somewhere around 30–35°F, though it depends ' +
        'entirely on the building and equipment. Knowing it is what lets you judge whether the aux ' +
        'heat you are seeing is normal for the weather or a symptom.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'O versus B, and inverted modes',
      body:
        'If a heat pump blows cold when you call for heat and warm when you call for cooling, the ' +
        'modes are exactly **inverted**. That points at reversing valve control, not the refrigerant ' +
        'circuit — a charge or airflow problem degrades performance, it does not swap heating and ' +
        'cooling.\n\n' +
        'O energises the valve in cooling. B energises it in heating. A thermostat configured for ' +
        'the wrong one gives precisely this symptom, and it is a very common error after a ' +
        'thermostat replacement.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Do not charge a heat pump in heating mode',
      body:
        'In heating, the outdoor coil is the evaporator, and its performance swings with outdoor ' +
        'temperature, humidity, frost accumulation and where the unit sits in its defrost cycle. ' +
        'The readings move around far too much to charge against.\n\n' +
        'Charge in **cooling mode** where the charts apply, or recover, evacuate and **weigh in** the ' +
        'nameplate charge with the line-set adjustment — which is accurate regardless of weather ' +
        'and is the right answer in winter.\n\n' +
        'Some units have a specific heating-mode procedure with its own chart. Where one exists, it ' +
        'takes precedence.',
    },
  ],
  source: cite.todo('Confirm the heat pump operation, defrost and charging guidance against your text.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_9_LESSONS: readonly Lesson[] = [heatPumps];
