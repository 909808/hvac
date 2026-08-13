import type { MeasurementId } from '@games/hvac/system';
import type { Tool, ToolId } from './types';

/**
 * The van.
 *
 * Every tool maps to measurements it makes possible in the Service Call
 * simulator. That is the whole point of the economy: an instrument is not a
 * number that goes up, it is the difference between being able to answer a
 * question on site and having to guess.
 *
 * Prices are rough street prices for decent mid-range gear, scaled so that the
 * early game is a real squeeze and the full kit is a season's work.
 */
export const TOOLS: readonly Tool[] = [
  {
    id: 'hand-tools',
    name: 'Hand tools',
    cost: 0,
    blurb: 'Screwdrivers, nut drivers, a flashlight. You start with these.',
    enables: ['filter-inspect', 'condenser-inspect', 'evaporator-inspect'],
  },
  {
    id: 'multimeter',
    name: 'Digital multimeter',
    cost: 180,
    blurb: 'Voltage, resistance, continuity. The first real instrument anyone buys.',
    enables: [],
    taughtIn: '5.0',
  },
  {
    id: 'clamp-meter',
    name: 'Clamp meter',
    cost: 240,
    blurb: 'Reads current without breaking the circuit. Tells you what a compressor is actually doing.',
    enables: ['compressor-amps'],
    taughtIn: '5.0',
  },
  {
    id: 'thermocouple',
    name: 'Clamp thermocouples',
    cost: 120,
    blurb: 'Pipe temperatures. Half of superheat and half of subcooling.',
    enables: ['suction-line-temp', 'liquid-line-temp', 'return-air-db', 'supply-air-db', 'ambient-temp'],
    taughtIn: '2.0',
  },
  {
    id: 'manifold-gauges',
    name: 'Manifold gauge set',
    cost: 320,
    blurb: 'The other half. System pressures, and the saturation temperatures behind them.',
    enables: ['suction-pressure', 'liquid-pressure'],
    taughtIn: '2.0',
  },
  {
    id: 'psychrometer',
    name: 'Digital psychrometer',
    cost: 210,
    blurb: 'Wet bulb, which is what a fixed-orifice charging chart actually wants.',
    enables: ['return-air-wb'],
    taughtIn: '7.0',
  },
  {
    id: 'manometer',
    name: 'Dual-port manometer',
    cost: 290,
    blurb: 'Static pressure. The instrument that finds the duct problems nobody measured.',
    enables: ['static-pressure'],
    taughtIn: '6.0',
  },
  {
    id: 'vacuum-pump',
    name: 'Vacuum pump',
    cost: 380,
    blurb: 'Required before any sealed system goes back together.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'micron-gauge',
    name: 'Micron gauge',
    cost: 230,
    blurb: 'Proves the evacuation held. Without it you are evacuating by the clock.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'recovery-machine',
    name: 'Recovery machine',
    cost: 720,
    blurb: 'Legally required before opening a system. Not optional, not negotiable.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'refrigerant-scale',
    name: 'Refrigerant scale',
    cost: 260,
    blurb: 'Weighing in is the most accurate charging method there is.',
    enables: [],
    taughtIn: '4.0',
  },
  {
    id: 'leak-detector',
    name: 'Electronic leak detector',
    cost: 340,
    blurb: 'Finds what the pressure test told you was there.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'nitrogen-kit',
    name: 'Nitrogen and regulator',
    cost: 290,
    blurb: 'Pressure testing and purging while brazing. Never oxygen.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'brazing-kit',
    name: 'Brazing torch set',
    cost: 450,
    blurb: 'Line sets, repairs, component changes.',
    enables: [],
    taughtIn: '3.0',
  },
  {
    id: 'combustion-analyser',
    name: 'Combustion analyser',
    cost: 890,
    blurb: 'The only instrument that answers "is this burning safely". Expensive and worth it.',
    enables: [],
    taughtIn: '8.0',
  },
];

export function tool(id: ToolId): Tool {
  const found = TOOLS.find((t) => t.id === id);
  if (!found) throw new Error(`unknown tool "${id}"`);
  return found;
}

export const STARTING_TOOLS: readonly ToolId[] = ['hand-tools'];

/**
 * Which measurements the owned kit can actually take.
 *
 * Passed into the Service Call simulator so the measurement list reflects the
 * van rather than an idealised toolbox.
 */
export function availableMeasurements(owned: readonly ToolId[]): Set<MeasurementId> {
  const out = new Set<MeasurementId>();
  for (const id of owned) {
    for (const m of tool(id).enables) out.add(m);
  }
  return out;
}

/**
 * The instrument a measurement needs.
 *
 * Every measurement in the simulator is enabled by exactly one tool, which is
 * what lets the Service Call screen say "buy a manometer" instead of greying a
 * button out with no explanation.
 */
export function toolForMeasurement(id: MeasurementId): Tool | undefined {
  return TOOLS.find((t) => t.enables.includes(id));
}

/** Tools not yet owned, cheapest first — the natural shopping order. */
export function shopList(owned: readonly ToolId[]): Tool[] {
  const have = new Set(owned);
  return TOOLS.filter((t) => !have.has(t.id) && t.cost > 0).sort((a, b) => a.cost - b.cost);
}

export function toolsMissingFor(
  required: readonly ToolId[],
  owned: readonly ToolId[],
): ToolId[] {
  const have = new Set(owned);
  return required.filter((id) => !have.has(id));
}
