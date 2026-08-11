import type { Profile } from './profile';
import type { Question, Sector, Track } from './types';

/**
 * Sector gating.
 *
 * The rule is deliberately simple: a sector opens when the one before it has
 * been passed. No partial unlocks, no XP thresholds. The ordering encodes what
 * depends on what, and skipping ahead mostly produces the experience of being
 * asked questions in a vocabulary you have not been taught yet.
 *
 * The first sector is always open, and a sector with no content is treated as
 * passable so that an incomplete track cannot lock you out of the rest of it.
 */

export interface CheckpointRecord {
  readonly sectorId: string;
  readonly passed: boolean;
  readonly bestPercent: number;
  readonly attempts: number;
  readonly lastAttemptAt: number;
}

export type SectorStatus = 'locked' | 'open' | 'passed';

export interface SectorProgress {
  readonly sector: Sector;
  readonly status: SectorStatus;
  readonly questionCount: number;
  readonly record: CheckpointRecord | undefined;
  /** Why it is locked, for the UI to explain rather than just greying it out. */
  readonly lockedBy: string | undefined;
}

export function sectorsOf(track: Track): readonly Sector[] {
  return [...(track.sectors ?? [])].sort((a, b) => a.order - b.order);
}

export function checkpointOf(profile: Profile, sectorId: string): CheckpointRecord | undefined {
  return profile.checkpoints[sectorId];
}

export function isPassed(profile: Profile, sectorId: string): boolean {
  return profile.checkpoints[sectorId]?.passed ?? false;
}

export function sectorProgress(
  track: Track,
  profile: Profile,
  questions: readonly Question[],
): SectorProgress[] {
  const sectors = sectorsOf(track);
  const forTrack = questions.filter((q) => q.track === track.id);

  return sectors.map((sector, index) => {
    const questionCount = forTrack.filter((q) => q.domain === sector.id).length;
    const record = checkpointOf(profile, sector.id);
    const previous = sectors[index - 1];

    let status: SectorStatus;
    let lockedBy: string | undefined;

    if (record?.passed) {
      status = 'passed';
    } else if (index === 0 || !previous) {
      status = 'open';
    } else if (isPassed(profile, previous.id)) {
      status = 'open';
    } else {
      // An empty sector cannot be passed, so it must not block what follows.
      const previousCount = forTrack.filter((q) => q.domain === previous.id).length;
      if (previousCount === 0) {
        status = 'open';
      } else {
        status = 'locked';
        lockedBy = previous.title;
      }
    }

    return { sector, status, questionCount, record, lockedBy };
  });
}

/** Labs unlocked by every sector currently open or passed. */
export function unlockedLabs(
  track: Track,
  profile: Profile,
  questions: readonly Question[],
): Set<string> {
  const out = new Set<string>();
  for (const entry of sectorProgress(track, profile, questions)) {
    if (entry.status === 'locked') continue;
    for (const lab of entry.sector.labs) out.add(lab);
  }
  return out;
}

/** Where the player is up to — the sector to nudge them toward next. */
export function currentSector(
  track: Track,
  profile: Profile,
  questions: readonly Question[],
): SectorProgress | undefined {
  const all = sectorProgress(track, profile, questions);
  return all.find((s) => s.status === 'open' && s.questionCount > 0) ?? all[0];
}

export function overallProgress(
  track: Track,
  profile: Profile,
  questions: readonly Question[],
): { passed: number; total: number } {
  const all = sectorProgress(track, profile, questions);
  return { passed: all.filter((s) => s.status === 'passed').length, total: all.length };
}
