/**
 * Spaced repetition, an SM-2 variant adapted for partial credit.
 *
 * Classic SM-2 takes a 0-5 self-graded quality. Here the grade is objective —
 * it comes from `grade()` — so credit in [0, 1] is mapped onto that scale. The
 * practical effect is that a near-miss on a select-all is scheduled sooner than
 * a clean pass but much later than a blank.
 */

export interface CardState {
  readonly id: string;
  /** Consecutive successful reviews. Reset to 0 on a lapse. */
  readonly reps: number;
  /** SM-2 ease factor. Higher means the interval grows faster. */
  readonly ease: number;
  readonly intervalDays: number;
  /** Epoch ms. */
  readonly dueAt: number;
  readonly lapses: number;
  readonly lastSeenAt: number;
  readonly totalSeen: number;
  readonly totalCorrect: number;
}

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

/** Credit at or above this counts as a pass and grows the interval. */
export const PASS_THRESHOLD = 0.6;

export function newCard(id: string, now: number): CardState {
  return {
    id,
    reps: 0,
    ease: DEFAULT_EASE,
    intervalDays: 0,
    dueAt: now,
    lapses: 0,
    lastSeenAt: 0,
    totalSeen: 0,
    totalCorrect: 0,
  };
}

const DAY_MS = 86_400_000;

/** Minutes, for the sub-day steps a card walks through before graduating. */
const LEARNING_STEPS_MIN = [1, 10];

export function review(card: CardState, credit: number, now: number): CardState {
  const passed = credit >= PASS_THRESHOLD;
  const quality = 5 * clamp01(credit);

  const seen = {
    lastSeenAt: now,
    totalSeen: card.totalSeen + 1,
    totalCorrect: card.totalCorrect + (credit >= 0.999 ? 1 : 0),
  };

  if (!passed) {
    // Lapse: back to the start of the learning steps, ease knocked down.
    return {
      ...card,
      ...seen,
      reps: 0,
      lapses: card.lapses + 1,
      ease: Math.max(MIN_EASE, card.ease - 0.2),
      intervalDays: 0,
      dueAt: now + LEARNING_STEPS_MIN[0]! * 60_000,
    };
  }

  const reps = card.reps + 1;
  const ease = Math.max(
    MIN_EASE,
    card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  // The first two passes are short learning steps; after that, real intervals.
  if (reps <= LEARNING_STEPS_MIN.length) {
    const stepMinutes = LEARNING_STEPS_MIN[reps - 1]!;
    return { ...card, ...seen, reps, ease, intervalDays: 0, dueAt: now + stepMinutes * 60_000 };
  }

  const intervalDays =
    reps === LEARNING_STEPS_MIN.length + 1
      ? 1
      : reps === LEARNING_STEPS_MIN.length + 2
        ? 4
        : Math.round(card.intervalDays * ease);

  return { ...card, ...seen, reps, ease, intervalDays, dueAt: now + intervalDays * DAY_MS };
}

export function isDue(card: CardState, now: number): boolean {
  return card.dueAt <= now;
}

/**
 * Order for a study session: overdue cards first (most overdue leading), then
 * cards never seen, then whatever is closest to due. Ties keep input order so
 * the caller's shuffle survives.
 */
export function scheduleOrder(cards: readonly CardState[], now: number): CardState[] {
  return [...cards].sort((a, b) => {
    const aDue = isDue(a, now);
    const bDue = isDue(b, now);
    if (aDue !== bDue) return aDue ? -1 : 1;
    if (aDue && bDue) {
      const aNew = a.totalSeen === 0;
      const bNew = b.totalSeen === 0;
      if (aNew !== bNew) return aNew ? 1 : -1; // overdue reviews before brand-new cards
      return a.dueAt - b.dueAt;
    }
    return a.dueAt - b.dueAt;
  });
}

/**
 * Mastery in [0, 1] for progress bars. Blends accuracy with how far the card
 * has travelled through the schedule, so a card answered right once does not
 * read as mastered.
 */
export function mastery(card: CardState): number {
  if (card.totalSeen === 0) return 0;
  const accuracy = card.totalCorrect / card.totalSeen;
  const maturity = Math.min(1, card.intervalDays / 21);
  const reliability = Math.min(1, card.totalSeen / 3);
  return clamp01(accuracy * 0.5 + maturity * 0.3 + reliability * 0.2) * accuracy;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
