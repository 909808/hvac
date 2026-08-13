import type { MeasurementId } from '@games/hvac/system';

/**
 * The career sim.
 *
 * The design premise: an XP bar is a meaningless reward when nothing spends it.
 * So there is no XP here. What you earn is **money**, **reputation** and
 * **rank**, and what those buy is the ability to do more interesting work.
 *
 * The curriculum is the tech tree. Passing sector 3 gets you EPA 608
 * certified, which is what lets you buy refrigerant and open a sealed system at
 * all. Passing sector 5 is what lets a customer trust you with an electrical
 * fault. The knowledge is not decorated with a reward — the knowledge *is* the
 * unlock, which is the only honest way to build this.
 *
 * Tools work the same way. You cannot measure static pressure without owning a
 * manometer, and the Service Call simulator enforces that literally: the
 * measurement is greyed out until the tool is in your van.
 */

// ---------------------------------------------------------------------------
// Rank
// ---------------------------------------------------------------------------

export type RankId = 'student' | 'apprentice' | 'technician' | 'lead' | 'owner';

export interface Rank {
  readonly id: RankId;
  readonly title: string;
  readonly blurb: string;
  /** Sectors that must be passed to hold this rank. */
  readonly requiresSectors: readonly string[];
  /** Completed jobs needed. */
  readonly requiresJobs: number;
  /** Money that must have passed through your hands, not your current balance. */
  readonly requiresEarned: number;
  /** Share of a job's ticket you keep. A student keeps very little. */
  readonly cut: number;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export type ToolId =
  | 'hand-tools'
  | 'multimeter'
  | 'clamp-meter'
  | 'manifold-gauges'
  | 'thermocouple'
  | 'psychrometer'
  | 'manometer'
  | 'vacuum-pump'
  | 'micron-gauge'
  | 'recovery-machine'
  | 'leak-detector'
  | 'combustion-analyser'
  | 'nitrogen-kit'
  | 'brazing-kit'
  | 'refrigerant-scale';

export interface Tool {
  readonly id: ToolId;
  readonly name: string;
  readonly cost: number;
  readonly blurb: string;
  /** Measurements this tool makes possible in the Service Call simulator. */
  readonly enables: readonly MeasurementId[];
  /** Sector that must be passed before this is worth owning — advisory, not a gate. */
  readonly taughtIn?: string;
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

export type DistrictId =
  | 'school'
  | 'suburbs'
  | 'oldtown'
  | 'downtown'
  | 'industrial'
  | 'techpark';

export interface District {
  readonly id: DistrictId;
  readonly name: string;
  readonly blurb: string;
  /** Minutes of travel from your base. Time is the real currency of a day. */
  readonly travelMinutes: number;
  /** Reputation needed before work here starts coming in. */
  readonly requiresReputation: number;
  /** Position on the town map, in a 0–100 grid. */
  readonly x: number;
  readonly y: number;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type JobSector =
  | 'residential'
  | 'light-commercial'
  | 'refrigeration'
  | 'data-center'
  | 'controls'
  | 'install';

/**
 * How a job is actually played.
 *
 * `diagnose` hands you the Service Call simulator. `knowledge` asks you the
 * questions the work depends on — which is why studying is not a side activity.
 * `routine` is work you can do once you own the tools, and exists so there is
 * always something to earn on a bad day.
 */
export type JobResolution = 'diagnose' | 'knowledge' | 'routine';

export interface JobTemplate {
  readonly id: string;
  readonly sector: JobSector;
  readonly title: string;
  /** What the customer says. */
  readonly complaint: string;
  readonly resolution: JobResolution;
  /** Districts this kind of work turns up in. */
  readonly districts: readonly DistrictId[];
  /** Sectors of the curriculum that must be passed. */
  readonly requiresSectors: readonly string[];
  readonly requiresTools: readonly ToolId[];
  readonly requiresRank: RankId;
  /**
   * The rank at which this work stops turning up.
   *
   * Nobody calls a lead technician to hold the light on a ride-along. Stated per
   * template rather than inferred from pay, because "is this beneath me now" is
   * a judgement about the work, not about the money.
   */
  readonly retiresAt?: RankId;
  readonly requiresReputation: number;
  /** Base ticket before your rank cut. */
  readonly pay: number;
  /** Minutes on site, before travel. */
  readonly minutes: number;
  /** Reputation gained for a clean job. */
  readonly reputation: number;
  /** For `knowledge` jobs: which sector's questions are asked. */
  readonly quizDomain?: string;
  /** For `diagnose` jobs: difficulty tier passed to the simulator. */
  readonly tier?: 1 | 2 | 3;
}

/** A job instance sitting on the board, at a place, on a day. */
export interface Job {
  readonly uid: string;
  readonly template: JobTemplate;
  readonly district: DistrictId;
  readonly client: string;
  /** Ticket for this instance, after variance. */
  readonly pay: number;
  /** Day it appeared. Jobs go stale. */
  readonly postedOn: number;
}

// ---------------------------------------------------------------------------
// Career state
// ---------------------------------------------------------------------------

export interface CareerState {
  readonly started: boolean;
  /** Seed for the whole career, so a given day's board is reproducible. */
  readonly seed: number;
  readonly day: number;
  /** Minutes left today. Travel and work both spend it. */
  readonly minutesLeft: number;
  readonly money: number;
  /** Lifetime earnings, which is what rank is measured against. */
  readonly earned: number;
  readonly reputation: number;
  readonly rank: RankId;
  readonly tools: readonly ToolId[];
  readonly jobsCompleted: number;
  readonly jobsFailed: number;
  /** Reputation per sector, so specialising is visible. */
  readonly sectorReputation: Readonly<Record<string, number>>;
  /** Job board for the current day. */
  readonly board: readonly Job[];
  /** Most recent outcomes, newest first, for the log. */
  readonly log: readonly CareerEvent[];
}

export interface CareerEvent {
  readonly day: number;
  readonly text: string;
  readonly money?: number;
  readonly kind: 'job' | 'purchase' | 'rank' | 'day' | 'note';
}

export const MINUTES_PER_DAY = 480;
