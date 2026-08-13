import type { CareerState, District, DistrictId } from '@career/types';
import { DISTRICTS } from '@career/world';
import { svg } from './dom';

/**
 * The town.
 *
 * A small hand-drawn map rather than a list of place names, because the point of
 * the districts is that they are *far apart* — the Tech Campus is fifty minutes
 * each way, and seeing that as distance on a page makes the day's planning read
 * as geography instead of arithmetic.
 *
 * Locked districts are drawn faintly rather than hidden. Knowing the data centre
 * work exists and is out of reach is the motivation; hiding it would waste it.
 */

const W = 100;
const H = 100;

/** Roads, as pairs of district ids. Drawn under the markers. */
const ROADS: readonly [DistrictId, DistrictId][] = [
  ['school', 'suburbs'],
  ['school', 'oldtown'],
  ['oldtown', 'downtown'],
  ['suburbs', 'downtown'],
  ['suburbs', 'industrial'],
  ['downtown', 'industrial'],
  ['downtown', 'techpark'],
  ['industrial', 'techpark'],
];

export interface TownMapOptions {
  readonly state: CareerState;
  /** Jobs on the board per district, for the little count badges. */
  readonly jobCounts: ReadonlyMap<DistrictId, number>;
  /** Districts with at least one job you could actually take right now. */
  readonly actionable: ReadonlySet<DistrictId>;
  readonly selected: DistrictId | undefined;
  onSelect(id: DistrictId | undefined): void;
}

export function renderTownMap(options: TownMapOptions): SVGElement {
  const { state } = options;
  const open = new Set(DISTRICTS.filter((d) => state.reputation >= d.requiresReputation).map((d) => d.id));

  const root = svg('svg', {
    class: 'townmap',
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': 'Map of the town, with the districts open to you marked',
  });

  // --- roads ---------------------------------------------------------------
  for (const [a, b] of ROADS) {
    const from = at(a);
    const to = at(b);
    const live = open.has(a) && open.has(b);
    root.appendChild(
      svg('line', {
        class: `town-road ${live ? '' : 'town-road-dim'}`,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      }),
    );
  }

  // --- districts -----------------------------------------------------------
  for (const d of DISTRICTS) {
    const unlocked = open.has(d.id);
    const count = options.jobCounts.get(d.id) ?? 0;
    const ready = options.actionable.has(d.id);
    const selected = options.selected === d.id;

    const group = svg('g', {
      class: [
        'town-node',
        unlocked ? 'town-node-open' : 'town-node-locked',
        ready ? 'town-node-ready' : '',
        selected ? 'town-node-selected' : '',
      ]
        .filter(Boolean)
        .join(' '),
      tabindex: '0',
      role: 'button',
      'aria-label': `${d.name}, ${count} job${count === 1 ? '' : 's'}`,
    });

    const select = (): void => options.onSelect(selected ? undefined : d.id);
    group.addEventListener('click', select);
    group.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        select();
      }
    });

    // A generous invisible hit target — the visible dot is 4 units across and
    // fingers are not.
    group.appendChild(svg('circle', { class: 'town-hit', cx: d.x, cy: d.y, r: 9 }));
    group.appendChild(svg('circle', { class: 'town-dot', cx: d.x, cy: d.y, r: 3.4 }));

    if (unlocked && count > 0) {
      group.appendChild(svg('circle', { class: 'town-badge', cx: d.x + 4.6, cy: d.y - 4.2, r: 2.7 }));
      const badge = svg('text', {
        class: 'town-badge-text',
        x: d.x + 4.6,
        y: d.y - 3.3,
        'text-anchor': 'middle',
      });
      badge.textContent = String(count);
      group.appendChild(badge);
    }

    const label = svg('text', {
      class: 'town-label',
      x: d.x,
      y: d.y + 8.4,
      'text-anchor': 'middle',
    });
    label.textContent = d.name;
    group.appendChild(label);

    // Locked districts keep their name and gain the price of admission. Naming
    // the place you cannot go yet is the point of drawing it at all.
    if (!unlocked) {
      const gate = svg('text', {
        class: 'town-gate',
        x: d.x,
        y: d.y + 12.4,
        'text-anchor': 'middle',
      });
      gate.textContent = `${d.requiresReputation} rep`;
      group.appendChild(gate);
    }

    root.appendChild(group);
  }

  return root;
}

function at(id: DistrictId): District {
  const found = DISTRICTS.find((d) => d.id === id);
  if (!found) throw new Error(`unknown district "${id}"`);
  return found;
}
