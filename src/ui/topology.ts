import type { NodeKind, Topology } from '@engine/types';
import { svg } from './dom';

/**
 * Renders a topology as inline SVG.
 *
 * Diagrams here exist to make a scenario readable at a glance — which device is
 * where, what is cabled to what, and which element is showing the symptom. The
 * fault colouring marks the *symptom*, never the cause, so the picture does not
 * give the answer away.
 */

const CELL_W = 150;
const CELL_H = 96;
const PAD = 28;
const NODE_W = 112;
const NODE_H = 46;

const GLYPHS: Record<NodeKind, string> = {
  router: '◍',
  switch: '⧉',
  firewall: '▤',
  server: '▥',
  pc: '▢',
  ap: '((•))',
  cloud: '☁',
  controller: '⚙',
  sensor: '◉',
};

export function renderTopology(topology: Topology): SVGElement {
  const maxCol = Math.max(...topology.nodes.map((n) => n.col));
  const maxRow = Math.max(...topology.nodes.map((n) => n.row));
  const width = (maxCol + 1) * CELL_W + PAD * 2;
  const height = (maxRow + 1) * CELL_H + PAD * 2;

  const root = svg('svg', {
    class: 'topology',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': topology.caption ?? 'Network topology diagram',
  });

  const centre = (col: number, row: number) => ({
    x: PAD + col * CELL_W + NODE_W / 2,
    y: PAD + row * CELL_H + NODE_H / 2,
  });

  const byId = new Map(topology.nodes.map((n) => [n.id, n]));

  // Links first, so nodes paint over the line ends.
  for (const link of topology.links) {
    const from = byId.get(link.from);
    const to = byId.get(link.to);
    if (!from || !to) continue;

    const a = centre(from.col, from.row);
    const b = centre(to.col, to.row);
    // Elbow routing: out horizontally, turn, then in horizontally.
    const midX = (a.x + b.x) / 2;
    const path = svg('path', {
      d: `M ${a.x} ${a.y} H ${midX} V ${b.y} H ${b.x}`,
      class: `topo-link topo-${link.state ?? 'ok'}`,
      fill: 'none',
    });
    root.appendChild(path);

    if (link.label) {
      // On a straight run the label sits above the line; on an elbow it sits
      // beside the vertical segment, so it never lands on top of the path.
      const straight = a.y === b.y;
      const label = svg('text', {
        x: straight ? midX : midX + 7,
        y: straight ? a.y - 7 : (a.y + b.y) / 2,
        class: 'topo-link-label',
        'text-anchor': straight ? 'middle' : 'start',
        'dominant-baseline': straight ? 'auto' : 'middle',
      });
      label.textContent = link.label;
      root.appendChild(label);
    }
  }

  for (const node of topology.nodes) {
    const { x, y } = centre(node.col, node.row);
    const group = svg('g', { class: `topo-node topo-${node.state ?? 'ok'}` });

    group.appendChild(
      svg('rect', {
        x: x - NODE_W / 2,
        y: y - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        rx: 8,
        class: 'topo-box',
      }),
    );

    const glyph = svg('text', {
      x: x - NODE_W / 2 + 13,
      y: y + 1,
      class: 'topo-glyph',
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    });
    glyph.textContent = GLYPHS[node.kind];
    group.appendChild(glyph);

    const label = svg('text', {
      x: x - NODE_W / 2 + 26,
      y: node.sublabel ? y - 3 : y + 1,
      class: 'topo-label',
      'dominant-baseline': 'middle',
    });
    label.textContent = node.label;
    group.appendChild(label);

    if (node.sublabel) {
      const sub = svg('text', {
        x: x - NODE_W / 2 + 26,
        y: y + 11,
        class: 'topo-sublabel',
        'dominant-baseline': 'middle',
      });
      sub.textContent = node.sublabel;
      group.appendChild(sub);
    }

    root.appendChild(group);
  }

  return root;
}
