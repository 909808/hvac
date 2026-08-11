/**
 * Refrigerant pressure–temperature relationships.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE TRUSTING THE NUMBERS
 *
 * The tables below are seeded from published saturation data and are accurate
 * to roughly ±2 psi across the comfort-cooling range. They are good enough to
 * train the *reasoning*, and they are the single highest-priority item in this
 * repo to check against a real manufacturer P-T chart — the one in your gauge
 * case is the authority, not this file.
 *
 * Why that is safe: the simulator generates every scenario from *saturation
 * temperature*, which is the physics that actually drives the diagnosis, and
 * converts to gauge pressure only for display. Superheat, subcooling, condenser
 * split and every fault signature are computed in °F. If a pressure here is off
 * by a psi or two, the reading on the gauge face shifts slightly and the correct
 * diagnosis does not change at all.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Blends with temperature glide (R-410A has very little; R-404A and R-407C have
 * more) have separate bubble- and dew-point curves. For the near-azeotropic
 * blends used here a single curve is the normal field simplification, and it is
 * what a P-T chart on a gauge set shows.
 */

export type RefrigerantId = 'R-22' | 'R-410A' | 'R-134a' | 'R-404A';

export interface Refrigerant {
  readonly id: RefrigerantId;
  readonly name: string;
  /** Ozone depletion / global warming class, as the EPA 608 exam frames it. */
  readonly class: 'CFC' | 'HCFC' | 'HFC' | 'HFO' | 'blend';
  readonly oil: string;
  readonly notes: string;
  /** Temperature glide in °F. Near-azeotropic blends are close to zero. */
  readonly glideF: number;
  /**
   * Typical high-pressure cutout for equipment using this refrigerant, psig.
   * Equipment-specific in reality — check the nameplate — but close enough to
   * model the lockout that stops a system running itself to destruction.
   */
  readonly highPressureCutout: number;
  /** Saturation curve: [°F, psig] pairs, ascending by temperature. */
  readonly curve: readonly (readonly [tempF: number, psig: number])[];
}

/**
 * Curves are stored at 10°F intervals and interpolated. A P-T chart is itself a
 * lookup table, so this mirrors what you would do by hand between printed rows.
 */
export const REFRIGERANTS: readonly Refrigerant[] = [
  {
    id: 'R-22',
    name: 'R-22 (HCFC-22)',
    class: 'HCFC',
    oil: 'Mineral oil',
    notes:
      'Phased out of new equipment; production and import of virgin R-22 ended in 2020. ' +
      'Still serviced from recovered and reclaimed stock.',
    glideF: 0,
    highPressureCutout: 400,
    curve: [
      [-40, 0.6],
      [-30, 4.9],
      [-20, 10.2],
      [-10, 16.5],
      [0, 24.0],
      [10, 32.8],
      [20, 43.0],
      [30, 54.9],
      [40, 68.5],
      [50, 84.0],
      [60, 101.6],
      [70, 121.4],
      [80, 143.7],
      [90, 168.4],
      [100, 195.9],
      [110, 226.4],
      [120, 259.9],
      [130, 296.8],
      [140, 337.3],
      [150, 382.0],
      [160, 431.2],
      [170, 485.0],
    ],
  },
  {
    id: 'R-410A',
    name: 'R-410A',
    class: 'blend',
    oil: 'POE (polyolester)',
    notes:
      'Near-azeotropic HFC blend of R-32 and R-125. Runs at roughly 60% higher pressure than ' +
      'R-22, so it needs its own gauges, and it must be charged as a liquid to keep the blend ' +
      'proportions right.',
    glideF: 0.2,
    highPressureCutout: 600,
    curve: [
      [-40, 13.3],
      [-30, 20.1],
      [-20, 28.4],
      [-10, 38.3],
      [0, 50.0],
      [10, 63.7],
      [20, 79.6],
      [30, 98.0],
      [40, 118.5],
      [50, 143.6],
      [60, 170.0],
      [70, 201.0],
      [80, 235.0],
      [90, 274.0],
      [100, 317.0],
      [110, 365.0],
      [120, 418.0],
      [130, 476.5],
      [140, 541.0],
      // R-410A reaches its critical point near 158°F, where the saturation
      // curve ends — there is no liquid/vapour boundary above it.
      [150, 611.5],
      [155, 649.0],
    ],
  },
  {
    id: 'R-134a',
    name: 'R-134a (HFC-134a)',
    class: 'HFC',
    oil: 'POE (polyolester)',
    notes:
      'Medium-temperature HFC. Common in chillers, automotive and commercial refrigeration. ' +
      'Operates at noticeably lower pressure than R-22.',
    glideF: 0,
    highPressureCutout: 275,
    curve: [
      [-20, -6.2],
      [-10, -1.5],
      [0, 6.5],
      [10, 11.9],
      [20, 18.4],
      [30, 26.1],
      [40, 35.0],
      [50, 45.4],
      [60, 57.4],
      [70, 71.1],
      [80, 86.7],
      [90, 104.3],
      [100, 124.1],
      [110, 146.3],
      [120, 171.1],
      [130, 198.7],
      [140, 229.2],
      [150, 262.6],
      [160, 299.4],
    ],
  },
  {
    id: 'R-404A',
    name: 'R-404A',
    class: 'blend',
    oil: 'POE (polyolester)',
    notes:
      'Near-azeotropic HFC blend used in low- and medium-temperature commercial refrigeration. ' +
      'High GWP, so it is being displaced by lower-GWP alternatives.',
    glideF: 1.0,
    highPressureCutout: 425,
    curve: [
      [-40, 4.3],
      [-30, 9.0],
      [-20, 15.3],
      [-10, 22.1],
      [0, 30.5],
      [10, 40.2],
      [20, 51.0],
      [30, 63.8],
      [40, 78.0],
      [50, 95.0],
      [60, 114.5],
      [70, 137.0],
      [80, 162.9],
      [90, 191.5],
      [100, 224.3],
      [110, 260.6],
      [120, 300.9],
      [130, 345.7],
      // R-404A's critical point is near 162°F, so the curve ends shortly after.
      [140, 395.8],
      [150, 452.0],
    ],
  },
];

export function refrigerant(id: RefrigerantId): Refrigerant {
  const found = REFRIGERANTS.find((r) => r.id === id);
  if (!found) throw new Error(`unknown refrigerant "${id}"`);
  return found;
}

/** Gauge pressure (psig) at a given saturation temperature (°F). */
export function pressureAt(id: RefrigerantId, tempF: number): number {
  const { curve } = refrigerant(id);
  return interpolate(curve, tempF, 'temp');
}

/** Saturation temperature (°F) at a given gauge pressure (psig). */
export function saturationTemp(id: RefrigerantId, psig: number): number {
  const { curve } = refrigerant(id);
  return interpolate(curve, psig, 'pressure');
}

/**
 * Linear interpolation between table rows, clamped at both ends.
 *
 * Clamping rather than extrapolating is deliberate: past the end of the table
 * the curve steepens sharply and a straight-line guess would be badly wrong.
 * The simulator never generates conditions outside the table.
 */
function interpolate(
  curve: readonly (readonly [number, number])[],
  value: number,
  axis: 'temp' | 'pressure',
): number {
  const from = axis === 'temp' ? 0 : 1;
  const to = axis === 'temp' ? 1 : 0;

  const first = curve[0]!;
  const last = curve[curve.length - 1]!;
  if (value <= first[from]) return first[to];
  if (value >= last[from]) return last[to];

  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i]!;
    const b = curve[i + 1]!;
    if (value >= a[from] && value <= b[from]) {
      const span = b[from] - a[from];
      const fraction = span === 0 ? 0 : (value - a[from]) / span;
      return round1(a[to] + fraction * (b[to] - a[to]));
    }
  }
  return last[to];
}

// ---------------------------------------------------------------------------
// The two numbers the whole trade runs on
// ---------------------------------------------------------------------------

/**
 * Superheat = suction line temperature − evaporator saturation temperature.
 *
 * It answers one question: how much of the evaporator is doing useful work?
 * Zero superheat means liquid is leaving the coil and heading for the
 * compressor. High superheat means the last stretch of coil has nothing left to
 * boil and is being wasted.
 */
export function superheat(
  id: RefrigerantId,
  suctionPsig: number,
  suctionLineTempF: number,
): number {
  return round1(suctionLineTempF - saturationTemp(id, suctionPsig));
}

/**
 * Subcooling = condenser saturation temperature − liquid line temperature.
 *
 * It answers: how much liquid is stacked in the condenser? It is the reading
 * that tells you about charge on a TXV system, where superheat is held constant
 * by the valve and therefore tells you nothing about charge at all.
 */
export function subcooling(
  id: RefrigerantId,
  liquidPsig: number,
  liquidLineTempF: number,
): number {
  return round1(saturationTemp(id, liquidPsig) - liquidLineTempF);
}

/**
 * Condenser split = condensing temperature − outdoor ambient.
 *
 * The cleanest single indicator of condenser heat rejection. A split well above
 * the design range means the condenser is not getting rid of heat: dirty coil,
 * failed fan, recirculating air, or non-condensables in the system.
 */
export function condenserSplit(
  id: RefrigerantId,
  liquidPsig: number,
  ambientF: number,
): number {
  return round1(saturationTemp(id, liquidPsig) - ambientF);
}

/** Typical design splits. Higher-SEER units run tighter because coils are larger. */
export const CONDENSER_SPLIT_RANGES = {
  standard: { min: 20, max: 30, label: '10–13 SEER, standard efficiency' },
  high: { min: 15, max: 20, label: '14+ SEER, high efficiency' },
} as const;

/**
 * Target superheat for a fixed-orifice system, from indoor wet bulb and outdoor
 * dry bulb. A TXV controls its own superheat, so this does not apply there —
 * charge a TXV system by subcooling.
 *
 * This is the standard manufacturer charging chart, approximated by the
 * relationship it encodes: superheat rises as indoor load rises and as outdoor
 * temperature falls.
 */
export function targetSuperheatFixedOrifice(indoorWetBulbF: number, outdoorDryBulbF: number): number {
  const raw = 1.4 * indoorWetBulbF - 0.7 * outdoorDryBulbF + 12;
  return Math.max(5, Math.min(35, Math.round(raw)));
}

/** Typical acceptance bands, used to judge a reading in the simulator. */
export const TARGETS = {
  txvSuperheat: { min: 8, max: 12 },
  subcooling: { min: 8, max: 12 },
  evaporatorDeltaT: { min: 16, max: 22 },
  cfmPerTon: { min: 350, max: 450 },
} as const;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
