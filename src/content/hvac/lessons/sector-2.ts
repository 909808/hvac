import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';
import type { Topology } from '@engine/types';

/** Sector 2 — The Refrigeration Cycle. */

const cycleDiagram: Topology = {
  caption: 'Follow the refrigerant: pressure rises only at the compressor, falls only at the metering device',
  nodes: [
    { id: 'comp', kind: 'compressor', label: 'Compressor', sublabel: 'LOW → HIGH', col: 0, row: 1 },
    { id: 'cond', kind: 'condenser', label: 'Condenser', sublabel: 'vapour → liquid', col: 1, row: 0 },
    { id: 'meter', kind: 'metering', label: 'Metering', sublabel: 'HIGH → LOW', col: 2, row: 1 },
    { id: 'evap', kind: 'evaporator', label: 'Evaporator', sublabel: 'liquid → vapour', col: 1, row: 2 },
  ],
  links: [
    { from: 'comp', to: 'cond', label: 'hot gas' },
    { from: 'cond', to: 'meter', label: 'warm liquid' },
    { from: 'meter', to: 'evap', label: 'cold mix' },
    { from: 'evap', to: 'comp', label: 'cool vapour' },
  ],
};

const theCycle = defineLesson({
  id: 'hvac.lesson.2.cycle',
  track: 'hvac',
  domain: '2.0',
  order: 1,
  title: 'The cycle: four parts, two pressures, two states',
  summary: 'Everything in the trade hangs off this loop. It is simpler than it looks.',
  minutes: 7,
  sections: [
    {
      kind: 'prose',
      body:
        'A refrigeration system is a loop with four components. Two of them change **pressure**, ' +
        'two of them change **state**, and they alternate around the loop.\n\n' +
        'The whole purpose is to make a fluid boil somewhere cold, so it absorbs heat, and then ' +
        'condense somewhere hot, so it rejects that heat. Since heat only flows from warm to cool, ' +
        'the refrigerant has to be colder than the house when it absorbs and hotter than the ' +
        'outdoors when it rejects. Manipulating pressure is how you arrange that.',
    },
    {
      kind: 'diagram',
      topology: cycleDiagram,
    },
    {
      kind: 'table',
      heading: 'What each component does',
      columns: ['Component', 'Changes', 'In', 'Out'],
      rows: [
        ['Compressor', 'Pressure ↑', 'Cool low-pressure vapour', 'Hot high-pressure vapour'],
        ['Condenser', 'State', 'Hot high-pressure vapour', 'Warm high-pressure liquid'],
        ['Metering device', 'Pressure ↓', 'Warm high-pressure liquid', 'Cold low-pressure mixture'],
        ['Evaporator', 'State', 'Cold low-pressure mixture', 'Cool low-pressure vapour'],
      ],
      note:
        'Everything between the compressor discharge and the metering device is the high side. ' +
        'Everything between the metering device and the compressor suction is the low side.',
    },
    {
      kind: 'prose',
      heading: 'Why the pressure drop is the clever part',
      body:
        'Ask why the metering device exists and the answer explains the whole machine.\n\n' +
        'At high side pressure, R-410A boils at 110°F or more. Useless — you cannot absorb heat ' +
        'from a 75°F room with something at 110°F. Drop the pressure to around 118 psig and the ' +
        'same refrigerant boils at about 40°F. Now it is comfortably colder than the room, so heat ' +
        'flows into it, and it boils.\n\n' +
        'The metering device does nothing but create that pressure drop. The compressor then has ' +
        'to push the pressure back up so the refrigerant will condense at a temperature above the ' +
        'outdoor air. That is what the electricity buys you.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'The compressor is a vapour pump',
      body:
        'Vapour compresses. Liquid does not. A slug of liquid in the cylinder has nowhere to go, ' +
        'and something mechanical gives — valves, a connecting rod, or the head.\n\n' +
        'The slower version is just as fatal: liquid dilutes the oil, washing the film off bearing ' +
        'surfaces until they fail.\n\n' +
        'This is why superheat exists as a measurement. Any superheat at all proves the refrigerant ' +
        'left the evaporator fully vaporised.',
    },
  ],
  source: cite.standard('Standard vapour-compression refrigeration cycle'),
  status: 'verified',
}) satisfies Lesson;

const superheatSubcooling = defineLesson({
  id: 'hvac.lesson.2.superheat',
  track: 'hvac',
  domain: '2.0',
  order: 2,
  title: 'Superheat and subcooling: seeing inside a sealed system',
  summary:
    'Two numbers, four readings, and suddenly you can tell what is happening inside a pipe you ' +
    'cannot open.',
  minutes: 9,
  sections: [
    {
      kind: 'prose',
      body:
        'You cannot see into a sealed system. Superheat and subcooling are how you find out what ' +
        'is going on anyway, and nearly all refrigerant-side diagnosis is built on them.\n\n' +
        'Both work the same way: compare a **measured temperature** against the **saturation ' +
        'temperature** the pressure says it should be. The gap between them is the information.',
    },
    {
      kind: 'prose',
      heading: 'First, what saturation means',
      body:
        'While a refrigerant is boiling or condensing, its pressure and temperature are locked ' +
        'together. Know one and a P-T chart gives you the other. That is what saturation is — ' +
        'liquid and vapour coexisting in equilibrium.\n\n' +
        'But once the last drop of liquid has boiled away, that lock breaks. Adding more heat now ' +
        'raises the temperature with no change in pressure. The refrigerant has become a ' +
        'superheated vapour, and a pressure reading no longer tells you its temperature.\n\n' +
        'The same happens on the other side. Once all the vapour has condensed, further cooling ' +
        'drops the temperature at constant pressure. That is subcooled liquid.\n\n' +
        'So a P-T chart only works inside the evaporator and condenser. Superheat and subcooling ' +
        'measure exactly how far reality has departed from the chart.',
    },
    {
      kind: 'keyNumbers',
      heading: 'The two formulas — note they subtract in opposite directions',
      items: [
        {
          label: 'Superheat',
          value: 'suction line temp − sat temp',
          note: 'Low side. Positive because vapour is heated ABOVE saturation',
        },
        {
          label: 'Subcooling',
          value: 'sat temp − liquid line temp',
          note: 'High side. Positive because liquid is cooled BELOW saturation',
        },
        { label: 'TXV superheat target', value: '8–12°F', note: 'The valve holds this' },
        { label: 'Subcooling target', value: '8–12°F', note: 'Check the nameplate' },
        { label: 'Fixed orifice superheat', value: 'From the chart', note: 'Varies with conditions' },
      ],
    },
    {
      kind: 'worked',
      heading: 'Worked example: calculate both',
      problem:
        'An R-410A system with a TXV:\n' +
        '  Low side 118 psig, suction line 52°F\n' +
        '  High side 317 psig, liquid line 88°F\n\n' +
        'Find superheat and subcooling, and say whether the system looks right.',
      steps: [
        {
          action: 'Convert the low side pressure to saturation temperature on the R-410A scale.',
          result: '118 psig → about 40°F',
        },
        {
          action: 'Superheat = suction line − saturation.',
          result: '52 − 40 = 12°F',
        },
        {
          action: 'Convert the high side pressure to condensing temperature.',
          result: '317 psig → about 100°F',
        },
        {
          action: 'Subcooling = condensing − liquid line. Note this subtraction runs the other way.',
          result: '100 − 88 = 12°F',
        },
        {
          action: 'Compare both against the target bands.',
          result: 'Superheat 12°F is at the top of 8–12. Subcooling 12°F likewise.',
        },
      ],
      answer: 'Superheat 12°F, subcooling 12°F — both within band. The system is correctly charged.',
      moral:
        'If you get a negative number, you subtracted the wrong way round. Superheat counts UP from ' +
        'saturation; subcooling counts DOWN from it.',
    },
    {
      kind: 'prose',
      heading: 'What each one is actually telling you',
      body:
        '**Superheat measures how much of the evaporator is doing useful work.**\n\n' +
        'Refrigerant enters the coil as a cold liquid–vapour mixture and boils along its length. ' +
        'The point where the last liquid disappears matters. If that happens right at the outlet, ' +
        'the whole coil was working — good. If it happens two thirds of the way along, the last ' +
        'third is just heating vapour, which is nearly useless, and superheat is high. If it never ' +
        'happens at all, liquid is leaving the coil toward the compressor, and superheat is near ' +
        'zero.\n\n' +
        '**Subcooling measures how much liquid is stacked in the condenser.**\n\n' +
        'It is the charge indicator, because extra refrigerant has nowhere to go but the condenser. ' +
        'More charge, more stacked liquid, more subcooling.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'Superheat cannot tell you the charge on a TXV system',
      body:
        'A TXV exists to hold superheat constant. Add refrigerant and it throttles back; remove ' +
        'some and it opens further. Superheat stays near 10°F either way, until the valve runs out ' +
        'of authority entirely.\n\n' +
        'So on a TXV system, **charge by subcooling.** On a fixed orifice — which has no way to ' +
        'respond to anything — **charge by superheat**, using the manufacturer\'s chart with indoor ' +
        'wet bulb and outdoor dry bulb.\n\n' +
        'Using the wrong method for the metering device is one of the most common ways a system ' +
        'ends up badly charged by somebody who was measuring carefully.',
    },
    {
      kind: 'table',
      heading: 'Reading the two together — the table worth memorising',
      columns: ['Superheat', 'Subcooling', 'What it means', 'Why'],
      rows: [
        ['HIGH', 'LOW', 'Undercharge or leak', 'Not enough refrigerant anywhere'],
        ['HIGH', 'HIGH', 'Restriction', 'Coil starves while refrigerant backs up behind the blockage'],
        ['LOW', 'HIGH', 'Overcharge', 'Excess floods the condenser and overfeeds the coil'],
        ['LOW', 'LOW', 'Metering device overfeeding', 'Valve passing too much without extra charge'],
      ],
      note:
        'This is the single most useful table in refrigerant diagnosis. Superheat ALONE cannot ' +
        'separate an undercharge from a restriction — both starve the coil. Subcooling is what ' +
        'tells them apart.',
    },
    {
      kind: 'prose',
      heading: 'And the third number: condenser split',
      body:
        'Condensing temperature minus outdoor ambient. It tells you whether the condenser is ' +
        'actually rejecting heat, and it already accounts for how hot it is outside — which head ' +
        'pressure alone does not.\n\n' +
        'Standard efficiency runs 20–30°F. High efficiency, with its larger coil, runs 15–20°F. A ' +
        'split well above the range means heat is not getting out: dirty coil, failed fan, ' +
        'recirculating air, or non-condensables in the system.\n\n' +
        'A head pressure of 400 psig sounds alarming until you notice it is 105°F outside, at which ' +
        'point the split is normal and the system is fine.',
    },
  ],
  source: cite.standard('Saturation properties; superheat and subcooling are standard refrigeration practice'),
  status: 'verified',
}) satisfies Lesson;

export const SECTOR_2_LESSONS: readonly Lesson[] = [theCycle, superheatSubcooling];
