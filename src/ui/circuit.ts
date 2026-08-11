import type { ServiceCallRun } from '@games/hvac/servicecall';
import type { MeasurementId } from '@games/hvac/system';
import { svg } from './dom';

/**
 * The refrigeration circuit, drawn live during a service call.
 *
 * Readings appear on the diagram at the point they were taken, so the picture
 * fills in as the call progresses. That is the whole reason it exists: seeing
 * suction pressure sitting next to the evaporator and head pressure next to the
 * condenser makes the layout of the system part of the diagnosis, instead of a
 * list of numbers in a table.
 */

const W = 620;
const H = 330;

interface Placement {
  readonly id: MeasurementId;
  readonly x: number;
  readonly y: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

/**
 * Where each reading lands on the diagram.
 *
 * Each one sits next to the component it describes: head pressure by the
 * condenser, suction pressure by the compressor, air temperatures by the
 * evaporator. Placing them on the picture rather than in a table is the point —
 * it puts "high side" and "low side" somewhere physical.
 */
const PLACEMENTS: readonly Placement[] = [
  { id: 'ambient-temp', x: 135, y: 28, anchor: 'middle' },
  { id: 'liquid-pressure', x: 135, y: 44, anchor: 'middle' },
  { id: 'liquid-line-temp', x: 305, y: 74, anchor: 'middle' },
  { id: 'suction-pressure', x: 305, y: 252, anchor: 'middle' },
  { id: 'suction-line-temp', x: 135, y: 290, anchor: 'middle' },
  { id: 'compressor-amps', x: 135, y: 306, anchor: 'middle' },
  { id: 'return-air-db', x: 565, y: 290, anchor: 'middle' },
  { id: 'supply-air-db', x: 565, y: 306, anchor: 'middle' },
];

export function renderCircuit(run: ServiceCallRun): SVGElement {
  const root = svg('svg', {
    class: 'circuit',
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': 'Refrigeration circuit with the readings taken so far',
  });

  // --- the loop ------------------------------------------------------------
  // Outdoor equipment sits left of the divider, indoor equipment right of it,
  // which is the layout of an actual split system. Getting that wrong on a
  // teaching diagram would quietly teach the wrong thing.
  const boxes = [
    { x: 60, y: 58, w: 150, h: 60, label: 'CONDENSER', sub: 'rejects heat' },
    { x: 60, y: 208, w: 150, h: 60, label: 'COMPRESSOR', sub: 'low → high P' },
    { x: 400, y: 58, w: 150, h: 60, label: 'METERING', sub: 'high → low P' },
    { x: 400, y: 208, w: 150, h: 60, label: 'EVAPORATOR', sub: 'absorbs heat' },
  ];

  // Pipes, drawn first so the boxes cover their ends.
  const pipes = [
    { d: 'M 135 208 L 135 118', cls: 'pipe-hot' },
    { d: 'M 210 88 L 400 88', cls: 'pipe-liquid' },
    { d: 'M 475 118 L 475 208', cls: 'pipe-mixture' },
    { d: 'M 400 238 L 210 238', cls: 'pipe-suction' },
  ];

  for (const pipe of pipes) {
    root.appendChild(svg('path', { d: pipe.d, class: `circuit-pipe ${pipe.cls}`, fill: 'none' }));
  }

  // Flow direction arrows: up the left side, across the top, down the right,
  // back across the bottom.
  const arrows = [
    { x: 135, y: 160, rotate: -90 },
    { x: 305, y: 88, rotate: 0 },
    { x: 475, y: 160, rotate: 90 },
    { x: 305, y: 238, rotate: 180 },
  ];
  for (const a of arrows) {
    const arrow = svg('path', {
      d: 'M -5 -4 L 5 0 L -5 4 Z',
      class: 'circuit-arrow',
      transform: `translate(${a.x} ${a.y}) rotate(${a.rotate})`,
    });
    root.appendChild(arrow);
  }

  for (const box of boxes) {
    root.appendChild(
      svg('rect', {
        x: box.x,
        y: box.y,
        width: box.w,
        height: box.h,
        rx: 8,
        class: 'circuit-box',
      }),
    );

    const label = svg('text', {
      x: box.x + box.w / 2,
      y: box.y + box.h / 2 - 4,
      class: 'circuit-label',
      'text-anchor': 'middle',
    });
    label.textContent = box.label;
    root.appendChild(label);

    const sub = svg('text', {
      x: box.x + box.w / 2,
      y: box.y + box.h / 2 + 12,
      class: 'circuit-sublabel',
      'text-anchor': 'middle',
    });
    sub.textContent = box.sub;
    root.appendChild(sub);
  }

  // The building envelope: condenser and compressor outside, evaporator and
  // metering device inside.
  root.appendChild(svg('line', { x1: 305, y1: 96, x2: 305, y2: 230, class: 'circuit-divider' }));
  root.appendChild(svg('line', { x1: 305, y1: 246, x2: 305, y2: 320, class: 'circuit-divider' }));

  const outLabel = svg('text', { x: 296, y: 318, class: 'circuit-zone', 'text-anchor': 'end' });
  outLabel.textContent = 'OUTDOOR';
  root.appendChild(outLabel);

  const inLabel = svg('text', { x: 314, y: 318, class: 'circuit-zone', 'text-anchor': 'start' });
  inLabel.textContent = 'INDOOR';
  root.appendChild(inLabel);

  // --- readings taken so far ------------------------------------------------
  const byId = new Map(run.readings.map((r) => [r.id, r]));

  for (const place of PLACEMENTS) {
    const reading = byId.get(place.id);
    if (!reading) continue;

    const text = svg('text', {
      x: place.x,
      y: place.y,
      class: 'circuit-reading',
      'text-anchor': place.anchor,
    });
    text.textContent = `${shortLabel(place.id)} ${reading.value}`;
    root.appendChild(text);
  }

  return root;
}

function shortLabel(id: MeasurementId): string {
  switch (id) {
    case 'suction-pressure':
      return 'LO';
    case 'liquid-pressure':
      return 'HI';
    case 'suction-line-temp':
      return 'suct';
    case 'liquid-line-temp':
      return 'liq';
    case 'ambient-temp':
      return 'ambient';
    case 'compressor-amps':
      return 'amps';
    case 'return-air-db':
      return 'RA';
    case 'supply-air-db':
      return 'SA';
    default:
      return '';
  }
}
