import type { Rng } from '@engine/rng';
import {
  FAULTS,
  MEASUREMENTS,
  derivedValues,
  fault,
  measurementDef,
  simulate,
  takeMeasurement,
  type Conditions,
  type DerivedValue,
  type FaultDef,
  type FaultId,
  type MeasurementId,
  type ReadingResult,
  type SystemSpec,
  type SystemState,
} from './system';

/**
 * The Service Call — the flagship simulator.
 *
 * A customer complaint, a system with something wrong, and a van full of
 * instruments. You choose what to measure, each reading costs time, and then you
 * commit to a diagnosis.
 *
 * The scoring is built to reward the habit the trade actually needs: gather the
 * readings that *discriminate* between the candidates, then decide. Guessing
 * correctly without evidence scores poorly on purpose — on a real call that is
 * how a good compressor gets replaced because somebody did not check the filter.
 */

export interface ServiceCallScenario {
  readonly id: string;
  readonly seed: number;
  readonly complaint: string;
  readonly customerNote: string;
  readonly spec: SystemSpec;
  readonly conditions: Conditions;
  readonly state: SystemState;
  readonly actualFault: FaultId;
  /** The diagnoses offered, always including the real one. */
  readonly candidates: readonly FaultId[];
  /** Difficulty tier, used to weight scoring and to gate by sector. */
  readonly tier: 1 | 2 | 3;
}

const EQUIPMENT: readonly Omit<SystemSpec, 'refrigerant'>[] = [
  { metering: 'fixed-orifice', tons: 2.5, rla: 13, efficiency: 'standard' },
  { metering: 'fixed-orifice', tons: 3, rla: 16, efficiency: 'standard' },
  { metering: 'txv', tons: 3, rla: 15, efficiency: 'high' },
  { metering: 'txv', tons: 4, rla: 20, efficiency: 'high' },
  { metering: 'txv', tons: 5, rla: 24, efficiency: 'standard' },
];

const CUSTOMER_NOTES = [
  'Homeowner says it has been getting worse over the last two weeks.',
  'Property manager reports the tenant has been complaining since the weekend.',
  'Owner had another company out last month for something unrelated.',
  'Unit is nine years old. No service records available.',
  'Customer changed the filter themselves recently and says that did not help.',
  'This is the third call on this system this season.',
];

/** Faults grouped by how hard they are to tell apart from their neighbours. */
const TIERS: Record<1 | 2 | 3, readonly FaultId[]> = {
  1: ['none', 'undercharge', 'dirty-condenser', 'low-evaporator-airflow', 'condenser-fan-failed'],
  2: ['overcharge', 'compressor-inefficient', 'txv-overfeeding'],
  3: ['restricted-metering', 'non-condensables'],
};

export function generateServiceCall(rng: Rng, tier?: 1 | 2 | 3): ServiceCallScenario {
  const chosenTier = tier ?? (rng.pick([1, 1, 2, 2, 3]) as 1 | 2 | 3);
  const actualFault = rng.pick(TIERS[chosenTier]);
  const def = fault(actualFault);

  const equipment = rng.pick(EQUIPMENT);
  const refrigerant = equipment.metering === 'txv' ? 'R-410A' : rng.pick(['R-410A', 'R-22'] as const);
  const spec: SystemSpec = { ...equipment, refrigerant };

  // A summer service call: warm outside, the house not keeping up.
  const outdoorDryBulbF = rng.int(82, 102);
  const returnDryBulbF = rng.int(74, 82);
  // Wet bulb must stay below dry bulb, and humid climates push it up.
  const returnWetBulbF = Math.min(returnDryBulbF - 6, rng.int(58, 71));

  const conditions: Conditions = {
    outdoorDryBulbF,
    returnDryBulbF,
    returnWetBulbF,
    cfmPerTon: actualFault === 'low-evaporator-airflow' ? rng.int(230, 300) : rng.int(380, 420),
  };

  const severity = actualFault === 'none' ? 0 : rng.int(55, 95) / 100;
  const state = simulate(spec, conditions, actualFault, severity);

  return {
    id: `hvac.servicecall.${rng.seed}`,
    seed: rng.seed,
    complaint: rng.pick(def.complaints),
    customerNote: rng.pick(CUSTOMER_NOTES),
    spec,
    conditions,
    state,
    actualFault,
    candidates: buildCandidates(rng, actualFault),
    tier: chosenTier,
  };
}

/**
 * Offer the real fault plus the ones it is genuinely confused with, so the
 * choice is a diagnosis rather than a process of elimination.
 */
function buildCandidates(rng: Rng, actual: FaultId): FaultId[] {
  const def = fault(actual);
  const picked = new Set<FaultId>([actual, ...def.confusedWith]);

  const rest = FAULTS.map((f) => f.id).filter((id) => !picked.has(id));
  for (const id of rng.shuffle(rest)) {
    if (picked.size >= 5) break;
    picked.add(id);
  }

  return rng.shuffle([...picked]);
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

export interface DiagnosisOutcome {
  readonly correct: boolean;
  readonly chosen: FaultId;
  readonly actual: FaultId;
  readonly actualDef: FaultDef;
  readonly chosenDef: FaultDef;
  readonly points: number;
  readonly minutesUsed: number;
  /** Key measurements the player did take. */
  readonly keyTaken: readonly MeasurementId[];
  /** Key measurements they skipped — the ones that would have settled it. */
  readonly keyMissed: readonly MeasurementId[];
  readonly grade: 'clean' | 'correct' | 'lucky' | 'wrong';
  readonly notes: readonly string[];
}

const BASE_POINTS = 500;
const TIME_BUDGET_MINUTES = 25;

/**
 * A single service call in progress. Deliberately mutable and small — the UI
 * drives it directly, and there is no scheduling or persistence in here.
 */
export class ServiceCallRun {
  readonly scenario: ServiceCallScenario;
  private readonly takenIds = new Set<MeasurementId>();
  private readonly results: ReadingResult[] = [];
  private minutes = 0;
  private outcome: DiagnosisOutcome | undefined;

  constructor(scenario: ServiceCallScenario) {
    this.scenario = scenario;
  }

  get taken(): ReadonlySet<MeasurementId> {
    return this.takenIds;
  }

  get readings(): readonly ReadingResult[] {
    return this.results;
  }

  get minutesUsed(): number {
    return this.minutes;
  }

  get finished(): boolean {
    return this.outcome !== undefined;
  }

  get result(): DiagnosisOutcome | undefined {
    return this.outcome;
  }

  /** Values that can be calculated from what has been measured so far. */
  derived(): DerivedValue[] {
    return derivedValues(this.scenario.state, this.takenIds);
  }

  measure(id: MeasurementId): ReadingResult {
    const existing = this.results.find((r) => r.id === id);
    if (existing) return existing;

    const reading = takeMeasurement(this.scenario.state, id);
    this.takenIds.add(id);
    this.minutes += measurementDef(id).minutes;
    this.results.push(reading);
    return reading;
  }

  /**
   * Commit to a diagnosis and score the call.
   *
   * Points break down as: the diagnosis itself, a bonus for having taken the
   * measurements that actually discriminate, and a time bonus for not measuring
   * everything in the van. Getting it right without evidence is capped — that is
   * the "lucky" grade, and it is deliberately unsatisfying.
   */
  diagnose(chosen: FaultId): DiagnosisOutcome {
    if (this.outcome) return this.outcome;

    const actual = this.scenario.actualFault;
    const actualDef = fault(actual);
    const correct = chosen === actual;

    const keyTaken = actualDef.keyMeasurements.filter((m) => this.takenIds.has(m));
    const keyMissed = actualDef.keyMeasurements.filter((m) => !this.takenIds.has(m));
    const keyShare =
      actualDef.keyMeasurements.length === 0
        ? 1
        : keyTaken.length / actualDef.keyMeasurements.length;

    const notes: string[] = [];
    let points = 0;
    let grade: DiagnosisOutcome['grade'];

    if (correct) {
      if (keyShare >= 0.75) {
        grade = this.minutes <= TIME_BUDGET_MINUTES ? 'clean' : 'correct';
        points = Math.round(BASE_POINTS * (1 + 0.5 * keyShare));
        notes.push(
          grade === 'clean'
            ? 'Right call, backed by the readings that prove it, inside the time budget.'
            : 'Right call and well evidenced, though it took a while to get there.',
        );
      } else {
        grade = 'lucky';
        points = Math.round(BASE_POINTS * 0.4);
        notes.push(
          'Right answer, but you did not take the readings that would prove it. On a real ' +
            'call that is a guess that happened to land — the next one will not.',
        );
      }
    } else {
      grade = 'wrong';
      points = 0;
      const chosenDef = fault(chosen);
      if (actualDef.confusedWith.includes(chosen)) {
        notes.push(
          `${chosenDef.name} is the classic confusion here, and the readings do separate them.`,
        );
      }
    }

    // Time bonus, only when the diagnosis was actually right.
    if (correct && this.minutes <= TIME_BUDGET_MINUTES) {
      const saved = TIME_BUDGET_MINUTES - this.minutes;
      points += saved * 8;
      notes.push(`${saved} minutes under budget.`);
    } else if (correct && this.minutes > TIME_BUDGET_MINUTES * 1.6) {
      notes.push(
        'Nearly every instrument came out of the van. Measuring everything works, but it is ' +
          'slow — the skill is knowing which three readings settle it.',
      );
    }

    if (keyMissed.length > 0) {
      notes.push(
        `Readings that would have settled it: ${keyMissed
          .map((m) => measurementDef(m).name.toLowerCase())
          .join(', ')}.`,
      );
    }

    this.outcome = {
      correct,
      chosen,
      actual,
      actualDef,
      chosenDef: fault(chosen),
      points,
      minutesUsed: this.minutes,
      keyTaken,
      keyMissed,
      grade,
      notes,
    };
    return this.outcome;
  }
}

/** Measurements grouped for the UI, in the order a technician would work. */
export function measurementGroups(): {
  group: string;
  label: string;
  items: readonly { id: MeasurementId; name: string; minutes: number; instrument: string }[];
}[] {
  const labels: Record<string, string> = {
    visual: 'Look first — cheap and often decisive',
    air: 'Air side',
    refrigerant: 'Refrigerant side — hook up the gauges',
    electrical: 'Electrical',
  };

  const order = ['visual', 'air', 'refrigerant', 'electrical'];
  return order.map((group) => ({
    group,
    label: labels[group] ?? group,
    items: MEASUREMENTS.filter((m) => m.group === group).map((m) => ({
      id: m.id,
      name: m.name,
      minutes: m.minutes,
      instrument: m.instrument,
    })),
  }));
}
