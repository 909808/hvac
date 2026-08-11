import type { CheckpointRecord } from './progression';
import type { CardState } from './srs';
import { mastery, newCard, review } from './srs';
import type { Question, TrackId } from './types';

export interface RunRecord {
  readonly mode: string;
  readonly track: TrackId;
  readonly at: number;
  readonly score: number;
  readonly asked: number;
  readonly correct: number;
  /** Present for exam-mode runs. */
  readonly percent?: number;
}

export interface Profile {
  readonly version: 3;
  readonly cards: Readonly<Record<string, CardState>>;
  readonly xp: number;
  readonly bestStreak: number;
  readonly runs: readonly RunRecord[];
  /** Best score per mode, for the "beat your record" loop. */
  readonly bests: Readonly<Record<string, number>>;
  /** Checkpoint results, keyed by sector id. Drives sector unlocking. */
  readonly checkpoints: Readonly<Record<string, CheckpointRecord>>;
}

const STORAGE_KEY = 'hvac-trainer:profile:v3';
const MAX_RUNS = 200;

export function emptyProfile(): Profile {
  return { version: 3, cards: {}, xp: 0, bestStreak: 0, runs: [], bests: {}, checkpoints: {} };
}

export function loadProfile(storage: Storage | undefined = safeStorage()): Profile {
  if (!storage) return emptyProfile();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (parsed.version !== 3) return emptyProfile();
    return {
      version: 3,
      cards: parsed.cards ?? {},
      xp: parsed.xp ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
      runs: parsed.runs ?? [],
      bests: parsed.bests ?? {},
      checkpoints: parsed.checkpoints ?? {},
    };
  } catch {
    // A corrupted profile should cost you your history, not the whole app.
    return emptyProfile();
  }
}

export function saveProfile(profile: Profile, storage: Storage | undefined = safeStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota or private-browsing failure. Play continues, progress just is not kept.
  }
}

export function clearProfile(storage: Storage | undefined = safeStorage()): void {
  storage?.removeItem(STORAGE_KEY);
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export function cardFor(profile: Profile, id: string, now: number): CardState {
  return profile.cards[id] ?? newCard(id, now);
}

export function recordReview(
  profile: Profile,
  questionId: string,
  credit: number,
  now: number,
): Profile {
  const card = review(cardFor(profile, questionId, now), credit, now);
  return { ...profile, cards: { ...profile.cards, [questionId]: card } };
}

/**
 * Record a checkpoint attempt. Once a sector is passed it stays passed — a
 * later weaker attempt must not re-lock everything downstream.
 */
export function recordCheckpoint(
  profile: Profile,
  sectorId: string,
  percent: number,
  passPercent: number,
  now: number,
): Profile {
  const previous = profile.checkpoints[sectorId];
  const record: CheckpointRecord = {
    sectorId,
    passed: (previous?.passed ?? false) || percent >= passPercent,
    bestPercent: Math.max(previous?.bestPercent ?? 0, Math.round(percent)),
    attempts: (previous?.attempts ?? 0) + 1,
    lastAttemptAt: now,
  };
  return { ...profile, checkpoints: { ...profile.checkpoints, [sectorId]: record } };
}

export function recordRun(profile: Profile, run: RunRecord, streak: number): Profile {
  const previousBest = profile.bests[run.mode] ?? 0;
  return {
    ...profile,
    xp: profile.xp + run.score,
    bestStreak: Math.max(profile.bestStreak, streak),
    runs: [run, ...profile.runs].slice(0, MAX_RUNS),
    bests: { ...profile.bests, [run.mode]: Math.max(previousBest, run.score) },
  };
}

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export interface ObjectiveProgress {
  readonly objective: string;
  readonly total: number;
  readonly seen: number;
  readonly mastery: number;
}

export function objectiveProgress(
  profile: Profile,
  questions: readonly Question[],
): ObjectiveProgress[] {
  const byObjective = new Map<string, Question[]>();
  for (const q of questions) {
    const list = byObjective.get(q.objective) ?? [];
    list.push(q);
    byObjective.set(q.objective, list);
  }

  return [...byObjective.entries()]
    .map(([objective, qs]) => {
      let seen = 0;
      let masterySum = 0;
      for (const q of qs) {
        const card = profile.cards[q.id];
        if (card && card.totalSeen > 0) {
          seen++;
          masterySum += mastery(card);
        }
      }
      return {
        objective,
        total: qs.length,
        seen,
        mastery: qs.length === 0 ? 0 : masterySum / qs.length,
      };
    })
    .sort((a, b) => a.objective.localeCompare(b.objective, undefined, { numeric: true }));
}

/** Questions the player is worst at, for the "shore up weak spots" mode. */
export function weakest(
  profile: Profile,
  questions: readonly Question[],
  limit: number,
): Question[] {
  return [...questions]
    .map((q) => {
      const card = profile.cards[q.id];
      // Unseen questions sort in the middle: worth doing, but a known miss is worse.
      const score = !card || card.totalSeen === 0 ? 0.5 : mastery(card);
      return { q, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.q);
}

export function levelFor(xp: number): { level: number; into: number; needed: number } {
  // Each level costs 100 more than the last: 100, 300, 600, 1000, ...
  let level = 1;
  let remaining = xp;
  let cost = 100;
  while (remaining >= cost) {
    remaining -= cost;
    level++;
    cost += 100;
  }
  return { level, into: remaining, needed: cost };
}
