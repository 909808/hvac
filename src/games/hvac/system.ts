import {
  condenserSplit,
  pressureAt,
  refrigerant,
  saturationTemp,
  subcooling,
  superheat,
  targetSuperheatFixedOrifice,
  type RefrigerantId,
} from './refrigerant';
import { judgeDeltaT } from './airflow';
import { stateFromDryBulbWetBulb } from './psychrometrics';

/**
 * A model of a split-system air conditioner, healthy or faulted.
 *
 * The design goal is not thermodynamic exactness — it is that every fault
 * produces the *signature* a technician is trained to recognise, and that the
 * signatures stay internally consistent. If you compute superheat from the
 * numbers this model hands you, you get the number the fault should produce,
 * because the readings are derived from the same underlying state rather than
 * written down separately.
 *
 * That is the same discipline as the subnetting generator in the Network+
 * track: the answer falls out of the model, so it cannot disagree with itself.
 */

export type MeteringDevice = 'txv' | 'fixed-orifice';

export interface SystemSpec {
  readonly refrigerant: RefrigerantId;
  readonly metering: MeteringDevice;
  readonly tons: number;
  /** Rated load amps for the compressor, used to judge the clamp reading. */
  readonly rla: number;
  /** Higher-efficiency units run a tighter condenser split. */
  readonly efficiency: 'standard' | 'high';
}

export interface Conditions {
  readonly outdoorDryBulbF: number;
  readonly returnDryBulbF: number;
  readonly returnWetBulbF: number;
  /** Actual delivered airflow, CFM per ton. Design is 400. */
  readonly cfmPerTon: number;
}

export type FaultId =
  | 'none'
  | 'undercharge'
  | 'overcharge'
  | 'restricted-metering'
  | 'dirty-condenser'
  | 'condenser-fan-failed'
  | 'low-evaporator-airflow'
  | 'compressor-inefficient'
  | 'non-condensables'
  | 'txv-overfeeding';

export interface FaultDef {
  readonly id: FaultId;
  readonly name: string;
  /** What the customer says on the phone. */
  readonly complaints: readonly string[];
  /** The one-line signature, shown after diagnosis. */
  readonly signature: string;
  readonly explain: string;
  /** Measurements that genuinely distinguish this fault from its neighbours. */
  readonly keyMeasurements: readonly MeasurementId[];
  /** Faults that look similar and are worth contrasting in the debrief. */
  readonly confusedWith: readonly FaultId[];
  readonly repair: string;
}

// ---------------------------------------------------------------------------
// Faults
// ---------------------------------------------------------------------------

export const FAULTS: readonly FaultDef[] = [
  {
    id: 'none',
    name: 'System operating normally',
    complaints: [
      'Customer wants a maintenance check before summer.',
      'New install — verify the charge and airflow before signing off.',
    ],
    signature: 'Superheat, subcooling, split and temperature drop all within band.',
    explain:
      'Nothing is wrong. Being willing to say so is part of the job — the pressure to find ' +
      'something and add refrigerant to a correctly charged system is how a lot of systems ' +
      'end up overcharged.',
    keyMeasurements: ['suction-pressure', 'liquid-pressure', 'suction-line-temp', 'liquid-line-temp'],
    confusedWith: [],
    repair: 'No corrective work required. Document the readings as a baseline.',
  },
  {
    id: 'undercharge',
    name: 'Undercharge (low refrigerant / leak)',
    complaints: [
      'Not cooling well. It ran fine last summer.',
      'Runs constantly and never satisfies the thermostat.',
      'There is ice on the copper line outside.',
    ],
    signature: 'Low suction, low head, HIGH superheat, LOW subcooling.',
    explain:
      'Too little refrigerant means the evaporator runs out of liquid before the end of the ' +
      'coil, so the remaining coil superheats the vapour — superheat climbs. At the same time ' +
      'there is not enough refrigerant to stack liquid in the condenser, so subcooling falls. ' +
      'High superheat with low subcooling is the pairing; either one alone is ambiguous.\n\n' +
      'Refrigerant does not get consumed. If it is low, it leaked, and adding more without ' +
      'finding the leak means being back next season.',
    keyMeasurements: ['suction-pressure', 'liquid-pressure', 'suction-line-temp', 'liquid-line-temp'],
    confusedWith: ['restricted-metering', 'compressor-inefficient'],
    repair: 'Leak search, repair, evacuate to 500 microns, weigh in the nameplate charge.',
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    complaints: [
      'Not cooling well since another company serviced it.',
      'The outdoor unit trips on the breaker when it is hot out.',
    ],
    signature: 'High head, high suction, LOW superheat, HIGH subcooling.',
    explain:
      'Excess refrigerant has nowhere to go but the condenser, where it stacks up and floods ' +
      'the lower rows. That reduces the surface available for condensing, so head pressure and ' +
      'subcooling both climb. Compressor amps rise with head pressure, which is what trips the ' +
      'breaker on a hot afternoon.\n\n' +
      'High subcooling with low superheat is the mirror image of an undercharge, and the ' +
      'contrast is the fastest way to tell them apart.',
    keyMeasurements: ['liquid-pressure', 'liquid-line-temp', 'compressor-amps', 'suction-pressure'],
    confusedWith: ['dirty-condenser', 'non-condensables'],
    repair: 'Recover refrigerant to the correct charge. Never vent. Verify by subcooling.',
  },
  {
    id: 'restricted-metering',
    name: 'Restricted metering device or liquid line',
    complaints: [
      'Barely any cool air, and the line outside is frosted over.',
      'It cools a little, then freezes solid.',
    ],
    signature: 'Low suction, HIGH superheat, HIGH subcooling — the diagnostic pairing.',
    explain:
      'A restriction throttles flow into the evaporator, so the coil starves: suction pressure ' +
      'falls and superheat climbs, exactly as in an undercharge. The difference is upstream — ' +
      'refrigerant backs up behind the restriction and stacks in the condenser, so subcooling ' +
      'goes UP rather than down.\n\n' +
      'High superheat + LOW subcooling = undercharge.\n' +
      'High superheat + HIGH subcooling = restriction.\n\n' +
      'That one contrast is worth more than any other pair of numbers on this list. A local ' +
      'temperature drop at the restriction — a filter drier noticeably colder than the line ' +
      'either side of it, sometimes sweating or frosted — pins the location.',
    keyMeasurements: ['suction-pressure', 'suction-line-temp', 'liquid-pressure', 'liquid-line-temp'],
    confusedWith: ['undercharge', 'low-evaporator-airflow'],
    repair: 'Replace the restricted component — usually the drier or the metering device.',
  },
  {
    id: 'dirty-condenser',
    name: 'Dirty condenser coil',
    complaints: [
      'Not keeping up on the hottest days. Fine in the morning.',
      'Outdoor unit is running hot and loud.',
    ],
    signature: 'HIGH head, high condenser split, high amps. Superheat normal.',
    explain:
      'The condenser cannot reject heat, so it condenses at a higher temperature to force the ' +
      'heat out — head pressure climbs. The metering device still controls flow into the ' +
      'evaporator, so superheat stays roughly normal, which is what separates this from a ' +
      'charge problem.\n\n' +
      'The number that names it is the condenser split — condensing temperature minus outdoor ' +
      'ambient. A standard-efficiency unit should run 20–30°F, a high-efficiency unit 15–20°F. ' +
      'A split well above that means heat is not getting out: dirty coil, failed fan, blocked ' +
      'airflow, or recirculation from something built too close to the unit.',
    keyMeasurements: ['liquid-pressure', 'ambient-temp', 'condenser-inspect', 'compressor-amps'],
    confusedWith: ['overcharge', 'non-condensables', 'condenser-fan-failed'],
    repair: 'Wash the coil from the inside out. Clear obstructions and check fan operation.',
  },
  {
    id: 'condenser-fan-failed',
    name: 'Condenser fan not running',
    complaints: [
      'It runs for a few minutes then shuts off, over and over.',
      'The outdoor fan is not spinning but the unit is humming.',
    ],
    signature: 'Very high head, extreme condenser split, high-pressure lockout.',
    explain:
      'With no air across the condenser there is almost no heat rejection, so head pressure ' +
      'climbs fast until the high-pressure switch opens. The short-cycling pattern — runs a ' +
      'few minutes, trips, restarts once pressure equalises — is characteristic.\n\n' +
      'This is the extreme case of the dirty-condenser signature. Look before you measure: a ' +
      'stationary fan blade answers the question in two seconds. Usual causes are a failed run ' +
      'capacitor, a seized bearing, or an open motor winding.',
    keyMeasurements: ['condenser-inspect', 'liquid-pressure', 'ambient-temp'],
    confusedWith: ['dirty-condenser', 'overcharge'],
    repair: 'Test the run capacitor and motor. Replace the failed component.',
  },
  {
    id: 'low-evaporator-airflow',
    name: 'Low evaporator airflow',
    complaints: [
      'Weak airflow from the vents and the coil keeps icing up.',
      'One end of the house never cools.',
    ],
    signature: 'Low suction, HIGH air temperature drop across the coil.',
    explain:
      'Less air over the coil means less heat arriving to boil the refrigerant, so the coil ' +
      'runs colder and suction pressure falls — which on the gauges alone looks like a low ' +
      'charge. The air side is what gives it away: the air that does pass through spends longer ' +
      'in contact with a colder coil, so the temperature DROP goes UP, often past 25°F.\n\n' +
      'Low suction with a high delta-T is airflow. Low suction with a low delta-T is charge or ' +
      'a restriction. Once the coil goes below freezing it ices, which blocks it further — a ' +
      'runaway that ends with a solid block of ice and no airflow at all.\n\n' +
      'Check the filter first. It is free, it takes ten seconds, and it is the cause more often ' +
      'than everything else on this list combined.',
    keyMeasurements: ['filter-inspect', 'return-air-db', 'supply-air-db', 'static-pressure'],
    confusedWith: ['undercharge', 'restricted-metering'],
    repair: 'Replace the filter, clean the blower wheel and coil, and check duct static pressure.',
  },
  {
    id: 'compressor-inefficient',
    name: 'Inefficient compressor (valve failure)',
    complaints: [
      'It runs all day and barely cools at all.',
      'Unit sounds like it is running but nothing is happening.',
    ],
    signature: 'HIGH suction, LOW head, LOW amps — the compressor is not pumping.',
    explain:
      'A compressor with failed valves recirculates gas internally instead of moving it. The ' +
      'pressures drift toward each other: suction rises because gas is not being pulled away, ' +
      'head falls because gas is not being delivered. Amps drop well below RLA, because doing ' +
      'no work costs no current.\n\n' +
      'Pressures converging with low amps is the signature. Nearly every other fault on this ' +
      'list pushes the two pressures apart, not together.',
    keyMeasurements: ['suction-pressure', 'liquid-pressure', 'compressor-amps'],
    confusedWith: ['undercharge', 'txv-overfeeding'],
    repair: 'Confirm with a closed-loop pump-down test, then replace the compressor.',
  },
  {
    id: 'non-condensables',
    name: 'Non-condensables (air in the system)',
    complaints: [
      'Not cooling well since the repair last month.',
      'Head pressure looks high but the coil is clean.',
    ],
    signature: 'High head and high split, but a CLEAN condenser and correct charge.',
    explain:
      'Air trapped in the system occupies condenser volume and adds its own partial pressure, ' +
      'so head pressure reads higher than the refrigerant temperature alone accounts for. ' +
      'The tell is the contradiction: condenser split is high, but the coil is clean and the ' +
      'fan is running properly, so there is no physical reason for poor heat rejection.\n\n' +
      'It almost always follows a repair where the system was opened and not properly ' +
      'evacuated. Pulling to 500 microns and holding it is what prevents this — nitrogen purge ' +
      'while brazing, then a deep vacuum with a micron gauge, not a timer.',
    keyMeasurements: ['liquid-pressure', 'ambient-temp', 'condenser-inspect', 'liquid-line-temp'],
    confusedWith: ['dirty-condenser', 'overcharge'],
    repair: 'Recover the charge, evacuate to 500 microns and hold, then weigh in a new charge.',
  },
  {
    id: 'txv-overfeeding',
    name: 'TXV overfeeding (sensing bulb loose or valve stuck open)',
    complaints: [
      'Poor cooling and the suction line is sweating right back to the compressor.',
      'Compressor is noisy on start-up.',
    ],
    signature: 'Very LOW superheat, high suction — liquid is leaving the evaporator.',
    explain:
      'The valve is feeding more refrigerant than the coil can boil, so liquid reaches the end ' +
      'of the evaporator and superheat collapses toward zero. A sweating or frosted suction ' +
      'line back to the compressor is the visual version of the same reading.\n\n' +
      'This is dangerous, not merely inefficient. Liquid entering a compressor does not ' +
      'compress — it dilutes the oil and can break valves or a rod outright. Near-zero ' +
      'superheat is a shut-it-down condition.\n\n' +
      'The usual cause is mundane: the sensing bulb has come loose from the suction line, so ' +
      'it senses ambient air instead of the pipe and holds the valve open.',
    keyMeasurements: ['suction-pressure', 'suction-line-temp', 'evaporator-inspect'],
    confusedWith: ['overcharge', 'compressor-inefficient'],
    repair: 'Re-secure and insulate the sensing bulb at 10 or 2 o\'clock on the suction line.',
  },
];

export function fault(id: FaultId): FaultDef {
  const found = FAULTS.find((f) => f.id === id);
  if (!found) throw new Error(`unknown fault "${id}"`);
  return found;
}

// ---------------------------------------------------------------------------
// Fault effects
// ---------------------------------------------------------------------------

interface Effect {
  /** Shift in evaporator saturation temperature, °F. */
  evapSat: number;
  /** Shift in condensing temperature, °F. */
  condSat: number;
  superheat: number;
  subcooling: number;
  /** Multiplier on compressor amps. */
  amps: number;
  /** Shift in the air-side temperature drop, °F. */
  deltaT: number;
}

const NO_EFFECT: Effect = {
  evapSat: 0,
  condSat: 0,
  superheat: 0,
  subcooling: 0,
  amps: 1,
  deltaT: 0,
};

/**
 * Each fault's effect, scaled by severity in [0, 1].
 *
 * These numbers encode the signatures above. Changing one changes what the game
 * teaches, so they are deliberately in one place and covered by tests that
 * assert the direction of every reading for every fault.
 */
function effectFor(id: FaultId, severity: number, metering: MeteringDevice): Effect {
  const s = Math.min(1, Math.max(0, severity));
  // A TXV holds superheat until it runs out of authority, so charge faults move
  // superheat much less on a TXV system than on a fixed orifice.
  const shAuthority = metering === 'txv' ? 0.35 : 1;

  switch (id) {
    case 'none':
      return NO_EFFECT;

    case 'undercharge':
      return {
        evapSat: -15 * s,
        condSat: -10 * s,
        superheat: 25 * s * shAuthority + (metering === 'txv' ? 12 * s * s : 0),
        subcooling: -14 * s,
        amps: 1 - 0.2 * s,
        deltaT: -9 * s,
      };

    case 'overcharge':
      return {
        evapSat: 5 * s,
        condSat: 18 * s,
        superheat: -8 * s * shAuthority,
        subcooling: 16 * s,
        amps: 1 + 0.25 * s,
        deltaT: -5 * s,
      };

    case 'restricted-metering':
      return {
        evapSat: -18 * s,
        condSat: -3 * s,
        superheat: 28 * s,
        subcooling: 11 * s,
        amps: 1 - 0.18 * s,
        deltaT: -10 * s,
      };

    case 'dirty-condenser':
      return {
        evapSat: 4 * s,
        condSat: 24 * s,
        superheat: -1 * s,
        subcooling: 4 * s,
        amps: 1 + 0.28 * s,
        deltaT: -4 * s,
      };

    case 'condenser-fan-failed':
      return {
        evapSat: 7 * s,
        condSat: 48 * s,
        superheat: -2 * s,
        subcooling: 6 * s,
        amps: 1 + 0.45 * s,
        deltaT: -7 * s,
      };

    case 'low-evaporator-airflow':
      return {
        evapSat: -15 * s,
        condSat: -7 * s,
        superheat: -5 * s * shAuthority,
        subcooling: 3 * s,
        amps: 1 - 0.1 * s,
        // The signature: the air side goes UP while the gauges go down.
        deltaT: 13 * s,
      };

    case 'compressor-inefficient':
      return {
        evapSat: 16 * s,
        condSat: -22 * s,
        superheat: 11 * s,
        subcooling: -7 * s,
        amps: 1 - 0.4 * s,
        deltaT: -12 * s,
      };

    case 'non-condensables':
      return {
        evapSat: 2 * s,
        condSat: 20 * s,
        superheat: 0,
        subcooling: 7 * s,
        amps: 1 + 0.18 * s,
        deltaT: -3 * s,
      };

    case 'txv-overfeeding':
      return {
        evapSat: 9 * s,
        condSat: 2 * s,
        // Drives superheat toward zero regardless of metering type.
        superheat: -14 * s,
        subcooling: -3 * s,
        amps: 1 + 0.08 * s,
        deltaT: -7 * s,
      };
  }
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

export interface SystemState {
  readonly spec: SystemSpec;
  readonly conditions: Conditions;
  readonly faultId: FaultId;
  readonly severity: number;

  readonly evaporatorSatF: number;
  readonly condensingSatF: number;
  readonly suctionPsig: number;
  readonly liquidPsig: number;
  readonly suctionLineTempF: number;
  readonly liquidLineTempF: number;
  readonly supplyDryBulbF: number;
  readonly supplyWetBulbF: number;
  readonly compressorAmps: number;

  readonly superheatF: number;
  readonly subcoolingF: number;
  readonly condenserSplitF: number;
  readonly evaporatorDeltaTF: number;
  readonly targetSuperheatF: number;

  /**
   * True when head pressure reached the high-pressure cutout. The switch opens
   * before the system can climb any higher, so this is the ceiling on every
   * pressure reading — and the reason the customer describes short-cycling
   * rather than a unit that simply runs badly.
   */
  readonly highPressureLockout: boolean;
}

/**
 * Build a complete system state from a spec, conditions and a fault.
 *
 * Every reading below is derived from the two saturation temperatures plus
 * superheat and subcooling, so the numbers a player measures and the numbers
 * they calculate from those measurements always agree.
 */
export function simulate(
  spec: SystemSpec,
  conditions: Conditions,
  faultId: FaultId,
  severity = 0.7,
): SystemState {
  const effect = effectFor(faultId, severity, spec.metering);

  // --- healthy baseline ----------------------------------------------------
  // The evaporator runs roughly 22°F below the entering wet bulb at design
  // airflow; starving it of air drives the coil colder still.
  const airflowShift = (conditions.cfmPerTon - 400) * 0.06;
  const baseEvapSat = conditions.returnWetBulbF - 22 + airflowShift;

  const designSplit = spec.efficiency === 'high' ? 17 : 25;
  const baseCondSat = conditions.outdoorDryBulbF + designSplit;

  const baseSuperheat =
    spec.metering === 'txv'
      ? 10
      : targetSuperheatFixedOrifice(conditions.returnWetBulbF, conditions.outdoorDryBulbF);
  const baseSubcooling = 10;

  // --- apply the fault -----------------------------------------------------
  const evaporatorSatF = round1(baseEvapSat + effect.evapSat);

  // The high-pressure switch is a hard ceiling. Without it the model would
  // happily run a failed-fan condenser past the top of the P-T curve, which is
  // both physically impossible and would desynchronise the derived readings
  // from the gauge readings.
  const cutoutTempF = saturationTemp(
    spec.refrigerant,
    refrigerantCutout(spec.refrigerant),
  );
  const uncappedCondSat = baseCondSat + effect.condSat;
  const highPressureLockout = uncappedCondSat >= cutoutTempF;
  const condensingSatF = round1(Math.min(uncappedCondSat, cutoutTempF));

  const superheatF = round1(Math.max(0, baseSuperheat + effect.superheat));
  const subcoolingF = round1(Math.max(0, baseSubcooling + effect.subcooling));

  // --- derive everything the technician can actually measure ---------------
  const suctionPsig = pressureAt(spec.refrigerant, evaporatorSatF);
  const liquidPsig = pressureAt(spec.refrigerant, condensingSatF);
  const suctionLineTempF = round1(evaporatorSatF + superheatF);
  const liquidLineTempF = round1(condensingSatF - subcoolingF);

  const baseDeltaT = Math.max(15, Math.min(24, Math.round(38 - 0.26 * conditions.returnWetBulbF)));
  const evaporatorDeltaTF = round1(Math.max(1, baseDeltaT + effect.deltaT));
  const supplyDryBulbF = round1(conditions.returnDryBulbF - evaporatorDeltaTF);

  // Supply air leaves close to saturation whenever the coil is doing latent work.
  const returnState = stateFromDryBulbWetBulb(conditions.returnDryBulbF, conditions.returnWetBulbF);
  const supplyWetBulbF = round1(
    Math.min(supplyDryBulbF, supplyDryBulbF - 1.5 + (returnState.relativeHumidity - 50) * 0.02),
  );

  return {
    spec,
    conditions,
    faultId,
    severity,
    evaporatorSatF,
    condensingSatF,
    suctionPsig,
    liquidPsig,
    suctionLineTempF,
    liquidLineTempF,
    supplyDryBulbF,
    supplyWetBulbF,
    compressorAmps: round1(spec.rla * 0.85 * effect.amps),
    superheatF,
    subcoolingF,
    condenserSplitF: round1(condensingSatF - conditions.outdoorDryBulbF),
    evaporatorDeltaTF,
    targetSuperheatF:
      spec.metering === 'txv'
        ? 10
        : targetSuperheatFixedOrifice(conditions.returnWetBulbF, conditions.outdoorDryBulbF),
    highPressureLockout,
  };
}

/** Cutout pressure for the refrigerant, backed off slightly to stay on the curve. */
function refrigerantCutout(id: RefrigerantId): number {
  return refrigerant(id).highPressureCutout;
}

/** Recompute superheat from the displayed gauge readings, as a tech would. */
export function measuredSuperheat(state: SystemState): number {
  return superheat(state.spec.refrigerant, state.suctionPsig, state.suctionLineTempF);
}

export function measuredSubcooling(state: SystemState): number {
  return subcooling(state.spec.refrigerant, state.liquidPsig, state.liquidLineTempF);
}

export function measuredSplit(state: SystemState): number {
  return condenserSplit(state.spec.refrigerant, state.liquidPsig, state.conditions.outdoorDryBulbF);
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export type MeasurementId =
  | 'suction-pressure'
  | 'liquid-pressure'
  | 'suction-line-temp'
  | 'liquid-line-temp'
  | 'return-air-db'
  | 'return-air-wb'
  | 'supply-air-db'
  | 'ambient-temp'
  | 'compressor-amps'
  | 'static-pressure'
  | 'filter-inspect'
  | 'condenser-inspect'
  | 'evaporator-inspect';

export interface MeasurementDef {
  readonly id: MeasurementId;
  readonly name: string;
  readonly instrument: string;
  /** Where on the system the reading is taken. */
  readonly location: string;
  /** Minutes it costs. Visual checks are nearly free; gauges cost real time. */
  readonly minutes: number;
  readonly group: 'refrigerant' | 'air' | 'electrical' | 'visual';
}

export const MEASUREMENTS: readonly MeasurementDef[] = [
  {
    id: 'filter-inspect',
    name: 'Inspect the air filter',
    instrument: 'Eyes',
    location: 'Return air / air handler',
    minutes: 1,
    group: 'visual',
  },
  {
    id: 'condenser-inspect',
    name: 'Inspect the condenser coil and fan',
    instrument: 'Eyes',
    location: 'Outdoor unit',
    minutes: 2,
    group: 'visual',
  },
  {
    id: 'evaporator-inspect',
    name: 'Inspect the evaporator coil and suction line',
    instrument: 'Eyes',
    location: 'Indoor coil',
    minutes: 3,
    group: 'visual',
  },
  {
    id: 'suction-pressure',
    name: 'Suction pressure',
    instrument: 'Manifold gauge, low side',
    location: 'Suction service valve',
    minutes: 5,
    group: 'refrigerant',
  },
  {
    id: 'liquid-pressure',
    name: 'Liquid (head) pressure',
    instrument: 'Manifold gauge, high side',
    location: 'Liquid service valve',
    minutes: 5,
    group: 'refrigerant',
  },
  {
    id: 'suction-line-temp',
    name: 'Suction line temperature',
    instrument: 'Clamp thermocouple',
    location: 'Suction line, 6 in. from the service valve',
    minutes: 3,
    group: 'refrigerant',
  },
  {
    id: 'liquid-line-temp',
    name: 'Liquid line temperature',
    instrument: 'Clamp thermocouple',
    location: 'Liquid line at the condenser outlet',
    minutes: 3,
    group: 'refrigerant',
  },
  {
    id: 'return-air-db',
    name: 'Return air dry bulb',
    instrument: 'Digital thermometer',
    location: 'Return plenum',
    minutes: 2,
    group: 'air',
  },
  {
    id: 'return-air-wb',
    name: 'Return air wet bulb',
    instrument: 'Psychrometer',
    location: 'Return plenum',
    minutes: 3,
    group: 'air',
  },
  {
    id: 'supply-air-db',
    name: 'Supply air dry bulb',
    instrument: 'Digital thermometer',
    location: 'Supply plenum, past the coil',
    minutes: 2,
    group: 'air',
  },
  {
    id: 'ambient-temp',
    name: 'Outdoor ambient temperature',
    instrument: 'Digital thermometer',
    location: 'Shaded side of the condenser',
    minutes: 1,
    group: 'air',
  },
  {
    id: 'static-pressure',
    name: 'Total external static pressure',
    instrument: 'Manometer',
    location: 'Supply and return plenums',
    minutes: 6,
    group: 'air',
  },
  {
    id: 'compressor-amps',
    name: 'Compressor running amps',
    instrument: 'Clamp meter',
    location: 'Common leg at the contactor',
    minutes: 3,
    group: 'electrical',
  },
];

export function measurementDef(id: MeasurementId): MeasurementDef {
  const found = MEASUREMENTS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown measurement "${id}"`);
  return found;
}

export interface ReadingResult {
  readonly id: MeasurementId;
  readonly label: string;
  readonly value: string;
  /** Extra context a technician would notice while taking it. */
  readonly note?: string;
}

/** Take a reading. Visual checks return a description of what the fault looks like. */
export function takeMeasurement(state: SystemState, id: MeasurementId): ReadingResult {
  const def = measurementDef(id);
  const f = state.faultId;

  switch (id) {
    case 'suction-pressure':
      return {
        id,
        label: def.name,
        value: `${state.suctionPsig.toFixed(1)} psig`,
        note: `Saturation ${saturationTemp(state.spec.refrigerant, state.suctionPsig).toFixed(1)}°F on the ${state.spec.refrigerant} scale`,
      };

    case 'liquid-pressure':
      return {
        id,
        label: def.name,
        value: `${state.liquidPsig.toFixed(1)} psig`,
        note: `Saturation ${saturationTemp(state.spec.refrigerant, state.liquidPsig).toFixed(1)}°F on the ${state.spec.refrigerant} scale`,
      };

    case 'suction-line-temp':
      return { id, label: def.name, value: `${state.suctionLineTempF.toFixed(1)}°F` };

    case 'liquid-line-temp':
      return { id, label: def.name, value: `${state.liquidLineTempF.toFixed(1)}°F` };

    case 'return-air-db':
      return { id, label: def.name, value: `${state.conditions.returnDryBulbF.toFixed(1)}°F` };

    case 'return-air-wb':
      return { id, label: def.name, value: `${state.conditions.returnWetBulbF.toFixed(1)}°F` };

    case 'supply-air-db':
      return {
        id,
        label: def.name,
        value: `${state.supplyDryBulbF.toFixed(1)}°F`,
        note: `${state.evaporatorDeltaTF.toFixed(1)}°F drop across the coil`,
      };

    case 'ambient-temp':
      return { id, label: def.name, value: `${state.conditions.outdoorDryBulbF.toFixed(1)}°F` };

    case 'compressor-amps': {
      const percent = Math.round((state.compressorAmps / state.spec.rla) * 100);
      return {
        id,
        label: def.name,
        value: `${state.compressorAmps.toFixed(1)} A`,
        note: `${percent}% of the ${state.spec.rla} A rated load`,
      };
    }

    case 'static-pressure': {
      // Static rises as airflow is restricted.
      const tesp =
        f === 'low-evaporator-airflow'
          ? 0.5 + 0.55 * state.severity
          : 0.42 + (400 - state.conditions.cfmPerTon) * 0.0005;
      return {
        id,
        label: def.name,
        value: `${Math.max(0.1, tesp).toFixed(2)} in. w.c.`,
        note: 'Air handler is rated for 0.50 in. w.c.',
      };
    }

    case 'filter-inspect':
      return {
        id,
        label: def.name,
        value:
          f === 'low-evaporator-airflow'
            ? 'Heavily loaded — grey, matted, light barely passes through'
            : 'Clean, recently changed',
      };

    case 'condenser-inspect':
      switch (f) {
        case 'dirty-condenser':
          return {
            id,
            label: def.name,
            value: 'Coil packed with cottonwood and grass clippings. Fan running normally.',
          };
        case 'condenser-fan-failed':
          return {
            id,
            label: def.name,
            value: 'Coil is clean. Fan motor is NOT turning — humming, blade free by hand.',
          };
        default:
          return { id, label: def.name, value: 'Coil clean, fan turning freely, good discharge air.' };
      }

    case 'evaporator-inspect':
      switch (f) {
        case 'txv-overfeeding':
          return {
            id,
            label: def.name,
            value: 'Suction line sweating heavily back toward the compressor. TXV sensing bulb hanging loose.',
          };
        case 'low-evaporator-airflow':
          return { id, label: def.name, value: 'Coil face partially iced over. Very little air moving.' };
        case 'undercharge':
          return { id, label: def.name, value: 'Light frost on the last few passes and at the metering device.' };
        case 'restricted-metering':
          return {
            id,
            label: def.name,
            value: 'Filter drier noticeably cold to the touch and sweating, lines either side of it warm.',
          };
        default:
          return { id, label: def.name, value: 'Coil clean and fully wetted, no frost, good airflow.' };
      }
  }
}

/** Derived values, available once their inputs have been measured. */
export interface DerivedValue {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly requires: readonly MeasurementId[];
  readonly verdict: 'low' | 'normal' | 'high';
  readonly target: string;
}

export function derivedValues(
  state: SystemState,
  taken: ReadonlySet<MeasurementId>,
): DerivedValue[] {
  const out: DerivedValue[] = [];
  const has = (...ids: MeasurementId[]) => ids.every((id) => taken.has(id));

  if (has('suction-pressure', 'suction-line-temp')) {
    const sh = measuredSuperheat(state);
    const target = state.targetSuperheatF;
    out.push({
      id: 'superheat',
      label: 'Superheat',
      value: `${sh.toFixed(1)}°F`,
      requires: ['suction-pressure', 'suction-line-temp'],
      verdict: sh < target - 4 ? 'low' : sh > target + 4 ? 'high' : 'normal',
      target:
        state.spec.metering === 'txv'
          ? 'TXV target 8–12°F'
          : `Fixed-orifice target ≈ ${target}°F for these conditions`,
    });
  }

  if (has('liquid-pressure', 'liquid-line-temp')) {
    const sc = measuredSubcooling(state);
    out.push({
      id: 'subcooling',
      label: 'Subcooling',
      value: `${sc.toFixed(1)}°F`,
      requires: ['liquid-pressure', 'liquid-line-temp'],
      verdict: sc < 6 ? 'low' : sc > 14 ? 'high' : 'normal',
      target: 'Target 8–12°F',
    });
  }

  if (has('liquid-pressure', 'ambient-temp')) {
    const split = measuredSplit(state);
    const max = state.spec.efficiency === 'high' ? 20 : 30;
    const min = state.spec.efficiency === 'high' ? 15 : 20;
    out.push({
      id: 'split',
      label: 'Condenser split',
      value: `${split.toFixed(1)}°F`,
      requires: ['liquid-pressure', 'ambient-temp'],
      verdict: split < min ? 'low' : split > max ? 'high' : 'normal',
      target: `${min}–${max}°F for a ${state.spec.efficiency}-efficiency unit`,
    });
  }

  if (has('return-air-db', 'supply-air-db')) {
    const dt = round1(state.conditions.returnDryBulbF - state.supplyDryBulbF);
    const judged = judgeDeltaT(dt, state.conditions.returnWetBulbF);
    out.push({
      id: 'delta-t',
      label: 'Evaporator temperature drop',
      value: `${dt.toFixed(1)}°F`,
      requires: ['return-air-db', 'supply-air-db'],
      verdict: judged.verdict,
      target: `Expect ${judged.expectedMin}–${judged.expectedMax}°F at ${state.conditions.returnWetBulbF}°F wet bulb`,
    });
  }

  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
