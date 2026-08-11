/**
 * Psychrometrics — the properties of moist air.
 *
 * Unlike the P-T tables, none of this is looked up. It is computed from the
 * ASHRAE formulation, so it is correct to the precision of the equations
 * themselves and there is nothing here to transcribe wrongly. That makes the
 * psychrometric drills the most reliable content in the HVAC track.
 *
 * Source: ASHRAE Handbook — Fundamentals, Chapter 1 (Psychrometrics). Equation
 * numbers cited below refer to that chapter. IP units throughout: °F, psia,
 * Btu/lb of dry air, lb water per lb dry air.
 */

/** Standard atmospheric pressure at sea level, psia. */
export const STANDARD_PRESSURE = 14.696;

/** Ratio of the molecular masses of water vapour and dry air. */
const MW_RATIO = 0.621945;

/** Atmospheric pressure at altitude, psia. ASHRAE Fundamentals Ch. 1, eq. 3. */
export function pressureAtAltitude(feet: number): number {
  return STANDARD_PRESSURE * (1 - 6.8754e-6 * feet) ** 5.2559;
}

/**
 * Saturation vapour pressure over water or ice, psia.
 * ASHRAE Fundamentals Ch. 1, equations 5 (ice, below 32°F) and 6 (water, above).
 */
export function saturationPressure(tempF: number): number {
  const T = tempF + 459.67; // °R

  if (tempF < 32) {
    const lnP =
      -1.0214165e4 / T +
      -4.8932428 +
      -5.3765794e-3 * T +
      1.9202377e-7 * T ** 2 +
      3.5575832e-10 * T ** 3 +
      -9.0344688e-14 * T ** 4 +
      4.1635019 * Math.log(T);
    return Math.exp(lnP);
  }

  const lnP =
    -1.0440397e4 / T +
    -1.129465e1 +
    -2.7022355e-2 * T +
    1.289036e-5 * T ** 2 +
    -2.4780681e-9 * T ** 3 +
    6.5459673 * Math.log(T);
  return Math.exp(lnP);
}

/** Humidity ratio at saturation for a given temperature, lb/lb. */
export function saturationHumidityRatio(tempF: number, pressure = STANDARD_PRESSURE): number {
  const pws = saturationPressure(tempF);
  // Above the boiling point at this altitude, saturation is unbounded.
  if (pws >= pressure) return Number.POSITIVE_INFINITY;
  return (MW_RATIO * pws) / (pressure - pws);
}

/** Humidity ratio from dry bulb and relative humidity (0–100). */
export function humidityRatioFromRh(
  dryBulbF: number,
  rhPercent: number,
  pressure = STANDARD_PRESSURE,
): number {
  const pw = (rhPercent / 100) * saturationPressure(dryBulbF);
  return (MW_RATIO * pw) / (pressure - pw);
}

/**
 * Humidity ratio from dry bulb and wet bulb.
 * ASHRAE Fundamentals Ch. 1, equations 33 (above freezing) and 34 (below).
 */
export function humidityRatioFromWetBulb(
  dryBulbF: number,
  wetBulbF: number,
  pressure = STANDARD_PRESSURE,
): number {
  const wsStar = saturationHumidityRatio(wetBulbF, pressure);

  if (wetBulbF >= 32) {
    return (
      ((1093 - 0.556 * wetBulbF) * wsStar - 0.24 * (dryBulbF - wetBulbF)) /
      (1093 + 0.444 * dryBulbF - wetBulbF)
    );
  }
  return (
    ((1220 - 0.04 * wetBulbF) * wsStar - 0.24 * (dryBulbF - wetBulbF)) /
    (1220 + 0.444 * dryBulbF - 0.48 * wetBulbF)
  );
}

/** Relative humidity (0–100) from dry bulb and humidity ratio. */
export function relativeHumidity(
  dryBulbF: number,
  humidityRatio: number,
  pressure = STANDARD_PRESSURE,
): number {
  const pw = (humidityRatio * pressure) / (MW_RATIO + humidityRatio);
  return Math.min(100, Math.max(0, (pw / saturationPressure(dryBulbF)) * 100));
}

/**
 * Enthalpy of moist air, Btu per lb of dry air.
 * ASHRAE Fundamentals Ch. 1, eq. 30.
 *
 * The two terms are the whole idea: 0.24·t is the sensible heat in the air, and
 * W·(1061 + 0.444·t) is the latent heat carried by the moisture. The 1061 is the
 * latent heat of vaporisation — which is why removing a little water costs so
 * much more capacity than dropping the temperature a few degrees.
 */
export function enthalpy(dryBulbF: number, humidityRatio: number): number {
  return 0.24 * dryBulbF + humidityRatio * (1061 + 0.444 * dryBulbF);
}

/** Specific volume, ft³ per lb of dry air. ASHRAE Fundamentals Ch. 1, eq. 28. */
export function specificVolume(
  dryBulbF: number,
  humidityRatio: number,
  pressure = STANDARD_PRESSURE,
): number {
  return (0.370486 * (dryBulbF + 459.67) * (1 + 1.607858 * humidityRatio)) / pressure;
}

/** Dew point, °F — the temperature at which this air would begin to condense. */
export function dewPoint(humidityRatio: number, pressure = STANDARD_PRESSURE): number {
  const pw = (humidityRatio * pressure) / (MW_RATIO + humidityRatio);
  if (pw <= 0) return -80;
  return solve((t) => saturationPressure(t) - pw, -80, 200);
}

/**
 * Wet bulb, °F. No closed form exists, so this inverts the humidity-ratio
 * relation numerically. Wet bulb cannot exceed dry bulb, which bounds the search.
 */
export function wetBulb(
  dryBulbF: number,
  humidityRatio: number,
  pressure = STANDARD_PRESSURE,
): number {
  return solve(
    (wb) => humidityRatioFromWetBulb(dryBulbF, wb, pressure) - humidityRatio,
    -80,
    dryBulbF,
  );
}

/** Bisection. The functions above are monotonic over the ranges searched. */
function solve(f: (x: number) => number, low: number, high: number): number {
  let a = low;
  let b = high;
  let fa = f(a);

  for (let i = 0; i < 80; i++) {
    const mid = (a + b) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-9 || b - a < 1e-6) return round2(mid);
    if (fa * fm < 0) {
      b = mid;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return round2((a + b) / 2);
}

// ---------------------------------------------------------------------------
// A complete air state
// ---------------------------------------------------------------------------

export interface AirState {
  readonly dryBulbF: number;
  readonly wetBulbF: number;
  readonly dewPointF: number;
  readonly relativeHumidity: number;
  readonly humidityRatio: number;
  /** Grains of moisture per lb of dry air — the unit on most field instruments. */
  readonly grains: number;
  readonly enthalpy: number;
  readonly specificVolume: number;
}

export function stateFromDryBulbWetBulb(
  dryBulbF: number,
  wetBulbF: number,
  pressure = STANDARD_PRESSURE,
): AirState {
  const w = Math.max(0, humidityRatioFromWetBulb(dryBulbF, wetBulbF, pressure));
  return buildState(dryBulbF, w, pressure);
}

export function stateFromDryBulbRh(
  dryBulbF: number,
  rhPercent: number,
  pressure = STANDARD_PRESSURE,
): AirState {
  const w = humidityRatioFromRh(dryBulbF, rhPercent, pressure);
  return buildState(dryBulbF, w, pressure);
}

function buildState(dryBulbF: number, w: number, pressure: number): AirState {
  return {
    dryBulbF: round2(dryBulbF),
    wetBulbF: wetBulb(dryBulbF, w, pressure),
    dewPointF: dewPoint(w, pressure),
    relativeHumidity: round2(relativeHumidity(dryBulbF, w, pressure)),
    humidityRatio: w,
    grains: round1(w * 7000),
    enthalpy: round2(enthalpy(dryBulbF, w)),
    specificVolume: round2(specificVolume(dryBulbF, w, pressure)),
  };
}

// ---------------------------------------------------------------------------
// The heat-transfer formulas
// ---------------------------------------------------------------------------

/**
 * Sensible heat, Btu/h. Qs = 1.08 × CFM × ΔT(dry bulb).
 *
 * The 1.08 is not magic: it is 60 min/h × 0.075 lb/ft³ (standard air density) ×
 * 0.24 Btu/lb·°F (specific heat of air). At altitude the density falls and so
 * does the constant, which is why a Denver job does not behave like a Houston one.
 */
export function sensibleHeat(cfm: number, deltaTF: number): number {
  return Math.round(1.08 * cfm * deltaTF);
}

/** Latent heat, Btu/h. Ql = 0.68 × CFM × Δgrains. */
export function latentHeat(cfm: number, deltaGrains: number): number {
  return Math.round(0.68 * cfm * deltaGrains);
}

/** Total heat, Btu/h. Qt = 4.5 × CFM × Δenthalpy. */
export function totalHeat(cfm: number, deltaEnthalpy: number): number {
  return Math.round(4.5 * cfm * deltaEnthalpy);
}

/** Heat carried by water, Btu/h. Q = 500 × GPM × ΔT. */
export function waterHeat(gpm: number, deltaTF: number): number {
  return Math.round(500 * gpm * deltaTF);
}

/** The 1.08 constant corrected for altitude, for work above sea level. */
export function sensibleConstantAtAltitude(feet: number): number {
  return round2(1.08 * (pressureAtAltitude(feet) / STANDARD_PRESSURE));
}

/** Sensible heat ratio — the share of total capacity doing temperature work. */
export function sensibleHeatRatio(sensible: number, total: number): number {
  return total === 0 ? 0 : round2(sensible / total);
}

export const TONS_TO_BTUH = 12000;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
