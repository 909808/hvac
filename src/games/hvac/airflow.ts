/**
 * Airflow, static pressure and fan laws.
 *
 * Airflow is where an enormous share of real service calls actually live. A
 * system starved of air looks, on the gauges, a lot like several other faults —
 * so the air-side numbers are what separate them.
 */

/** Nominal design airflow. 400 CFM/ton is the usual target; 350–450 is the band. */
export const NOMINAL_CFM_PER_TON = 400;

/**
 * Total external static pressure — what the blower is working against.
 *
 * Measured as the sum of the *absolute* values of supply and return static, so a
 * return reading of −0.35 and a supply of +0.30 gives a TESP of 0.65 in. w.c.
 * Getting the sign handling wrong here is a classic way to under-read a badly
 * restricted system.
 */
export function totalExternalStatic(supplyStatic: number, returnStatic: number): number {
  return round2(Math.abs(supplyStatic) + Math.abs(returnStatic));
}

/** Most residential air handlers are rated at 0.50 in. w.c. */
export const RATED_TESP = 0.5;

/**
 * Friction rate for duct sizing, in. w.c. per 100 ft of equivalent length.
 * FR = (available static × 100) / total equivalent length.
 */
export function frictionRate(availableStatic: number, totalEquivalentLength: number): number {
  if (totalEquivalentLength <= 0) throw new Error('equivalent length must be positive');
  return round3((availableStatic * 100) / totalEquivalentLength);
}

/** Airflow through a duct: CFM = velocity (fpm) × area (ft²). */
export function cfmFromVelocity(velocityFpm: number, areaSqFt: number): number {
  return Math.round(velocityFpm * areaSqFt);
}

export function ductAreaSqFt(widthInches: number, heightInches: number): number {
  return round3((widthInches * heightInches) / 144);
}

/** Area of a round duct, ft². */
export function roundDuctAreaSqFt(diameterInches: number): number {
  return round3((Math.PI * (diameterInches / 2) ** 2) / 144);
}

// ---------------------------------------------------------------------------
// Fan laws
// ---------------------------------------------------------------------------

/**
 * The three fan laws, from a change in speed.
 *
 * The reason they matter on a service call: doubling airflow costs eight times
 * the horsepower. Speeding a blower up to fix an airflow complaint can push the
 * motor past its rating, and the third law is why.
 */
export const fanLaws = {
  /** CFM varies directly with RPM. */
  cfm: (cfm1: number, rpm1: number, rpm2: number): number => Math.round(cfm1 * (rpm2 / rpm1)),

  /** Static pressure varies with the square of RPM. */
  staticPressure: (sp1: number, rpm1: number, rpm2: number): number =>
    round3(sp1 * (rpm2 / rpm1) ** 2),

  /** Brake horsepower varies with the cube of RPM. */
  horsepower: (bhp1: number, rpm1: number, rpm2: number): number =>
    round3(bhp1 * (rpm2 / rpm1) ** 3),
} as const;

// ---------------------------------------------------------------------------
// Air-side checks
// ---------------------------------------------------------------------------

export function cfmPerTon(cfm: number, tons: number): number {
  return Math.round(cfm / tons);
}

/**
 * Airflow implied by measured capacity and temperature drop, from the sensible
 * heat equation rearranged: CFM = Qs / (1.08 × ΔT).
 */
export function cfmFromSensible(sensibleBtuh: number, deltaTF: number): number {
  if (deltaTF === 0) return 0;
  return Math.round(sensibleBtuh / (1.08 * deltaTF));
}

export type AirflowVerdict = 'low' | 'normal' | 'high';

/**
 * Judge an evaporator temperature drop.
 *
 * The band depends on humidity, which is why this takes wet bulb rather than
 * just a target number: dry indoor air gives up more sensible heat and drops
 * further, humid air spends capacity on latent removal and drops less. A 25°F
 * split is a red flag in Houston and unremarkable in Phoenix.
 */
export function judgeDeltaT(deltaTF: number, returnWetBulbF: number): {
  verdict: AirflowVerdict;
  expectedMin: number;
  expectedMax: number;
} {
  // Roughly a 20°F drop at 69°F WB, sliding to 24°F as the air dries out and
  // to 16°F as it gets muggy and more of the capacity goes to latent removal.
  const expected = Math.max(15, Math.min(24, Math.round(38 - 0.26 * returnWetBulbF)));
  const expectedMin = expected - 3;
  const expectedMax = expected + 3;

  if (deltaTF < expectedMin) return { verdict: 'low', expectedMin, expectedMax };
  if (deltaTF > expectedMax) return { verdict: 'high', expectedMin, expectedMax };
  return { verdict: 'normal', expectedMin, expectedMax };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
