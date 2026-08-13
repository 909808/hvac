import type { District, DistrictId, Rank, RankId } from './types';

/**
 * The town.
 *
 * Six districts, each with its own character of work. Travel time is the real
 * constraint: a day is 480 minutes, and forty of them spent driving to the tech
 * park is forty you do not spend earning.
 *
 * Reputation opens districts rather than money, because nobody lets a stranger
 * into a data centre no matter what their van looks like.
 */
export const DISTRICTS: readonly District[] = [
  {
    id: 'school',
    name: 'Trade School',
    blurb: 'Where you started. Ride-alongs and supervised work, poor pay, no risk.',
    travelMinutes: 10,
    requiresReputation: 0,
    x: 22,
    y: 74,
  },
  {
    id: 'suburbs',
    name: 'Maple Heights',
    blurb: 'Residential split systems, furnaces, the occasional heat pump. Bread and butter.',
    travelMinutes: 20,
    requiresReputation: 0,
    x: 48,
    y: 80,
  },
  {
    id: 'oldtown',
    name: 'Old Town',
    blurb: 'Older housing stock. R-22 systems, tired ductwork, atmospheric furnaces.',
    travelMinutes: 25,
    requiresReputation: 12,
    x: 30,
    y: 46,
  },
  {
    id: 'downtown',
    name: 'Downtown',
    blurb: 'Light commercial. Rooftop units, restaurants, small offices.',
    travelMinutes: 35,
    requiresReputation: 30,
    x: 58,
    y: 40,
  },
  {
    id: 'industrial',
    name: 'Industrial Park',
    blurb: 'Walk-in coolers, freezers, process cooling. Refrigeration proper.',
    travelMinutes: 45,
    requiresReputation: 55,
    x: 80,
    y: 62,
  },
  {
    id: 'techpark',
    name: 'Tech Campus',
    blurb: 'CRAC units and controls. High stakes, high pay, no tolerance for guessing.',
    travelMinutes: 50,
    requiresReputation: 85,
    x: 74,
    y: 18,
  },
];

export function district(id: DistrictId): District {
  const found = DISTRICTS.find((d) => d.id === id);
  if (!found) throw new Error(`unknown district "${id}"`);
  return found;
}

export function openDistricts(reputation: number): District[] {
  return DISTRICTS.filter((d) => reputation >= d.requiresReputation);
}

// ---------------------------------------------------------------------------
// Ranks
// ---------------------------------------------------------------------------

/**
 * Career ranks.
 *
 * Each requires knowledge as well as experience, which is the point — you
 * cannot grind your way to Technician without passing the sectors that a
 * technician is expected to know. `cut` is the share of a ticket you keep: a
 * student is being trained, an owner keeps the lot.
 */
export const RANKS: readonly Rank[] = [
  {
    id: 'student',
    title: 'Student',
    blurb: 'Enrolled at the trade school. Watching, holding the light, learning the names of things.',
    requiresSectors: [],
    requiresJobs: 0,
    requiresEarned: 0,
    cut: 0.45,
  },
  {
    id: 'apprentice',
    title: 'Apprentice',
    blurb:
      'Taken on by a shop. Filters, coil cleans, and whatever the lead tech does not want to do.',
    requiresSectors: ['1.0'],
    requiresJobs: 3,
    requiresEarned: 120,
    cut: 0.5,
  },
  {
    id: 'technician',
    title: 'Technician',
    blurb: 'Running your own calls. EPA certified, gauges on the system, decisions are yours.',
    requiresSectors: ['1.0', '2.0', '3.0'],
    requiresJobs: 10,
    requiresEarned: 900,
    cut: 0.65,
  },
  {
    id: 'lead',
    title: 'Lead Technician',
    blurb:
      'The one they send when the last two people could not work it out. Commercial and refrigeration.',
    requiresSectors: ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0'],
    requiresJobs: 25,
    requiresEarned: 5000,
    cut: 0.8,
  },
  {
    id: 'owner',
    title: 'Owner',
    blurb: 'Your name on the van. Every ticket is yours, and so is every callback.',
    requiresSectors: ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0', '7.0', '8.0', '9.0', '10.0'],
    requiresJobs: 50,
    requiresEarned: 20000,
    cut: 1.0,
  },
];

export function rank(id: RankId): Rank {
  const found = RANKS.find((r) => r.id === id);
  if (!found) throw new Error(`unknown rank "${id}"`);
  return found;
}

export function rankIndex(id: RankId): number {
  return RANKS.findIndex((r) => r.id === id);
}

export function meetsRank(required: RankId, held: RankId): boolean {
  return rankIndex(held) >= rankIndex(required);
}

export interface RankProgress {
  readonly next: Rank | undefined;
  readonly sectorsMissing: readonly string[];
  readonly jobsShort: number;
  readonly earnedShort: number;
  readonly ready: boolean;
}

/** What stands between you and the next rank, stated concretely. */
export function rankProgress(
  held: RankId,
  passedSectors: ReadonlySet<string>,
  jobsCompleted: number,
  earned: number,
): RankProgress {
  const next = RANKS[rankIndex(held) + 1];
  if (!next) {
    return { next: undefined, sectorsMissing: [], jobsShort: 0, earnedShort: 0, ready: false };
  }

  const sectorsMissing = next.requiresSectors.filter((s) => !passedSectors.has(s));
  const jobsShort = Math.max(0, next.requiresJobs - jobsCompleted);
  const earnedShort = Math.max(0, next.requiresEarned - earned);

  return {
    next,
    sectorsMissing,
    jobsShort,
    earnedShort,
    ready: sectorsMissing.length === 0 && jobsShort === 0 && earnedShort === 0,
  };
}

/** The highest rank currently earned. Ranks are never lost. */
export function earnedRank(
  passedSectors: ReadonlySet<string>,
  jobsCompleted: number,
  earned: number,
): RankId {
  let best: RankId = 'student';
  for (const r of RANKS) {
    const ok =
      r.requiresSectors.every((s) => passedSectors.has(s)) &&
      jobsCompleted >= r.requiresJobs &&
      earned >= r.requiresEarned;
    if (ok) best = r.id;
  }
  return best;
}
