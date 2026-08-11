import { createRng, randomSeed } from '@engine/rng';
import type { SessionConfig } from '@engine/session';
import { buildExam, filterQuestions } from '@engine/select';
import { weakest, type Profile } from '@engine/profile';
import { cardFor } from '@engine/profile';
import { scheduleOrder } from '@engine/srs';
import type { Question, Track } from '@engine/types';
import { generatePortQuestions } from '@games/portrush';
import { generateSubnetQuestions } from '@games/subnet';

export type ModeId = 'drill' | 'subnet' | 'ports' | 'exam' | 'weak';

export interface ModeDef {
  readonly id: ModeId;
  readonly name: string;
  readonly tagline: string;
  readonly detail: string;
  readonly glyph: string;
  /** Only offered for tracks that have the content this mode needs. */
  readonly tracks: readonly string[];
}

export const MODES: readonly ModeDef[] = [
  {
    id: 'drill',
    name: 'Drill',
    tagline: 'Spaced-repetition practice',
    detail:
      'Works through the question bank in the order the scheduler thinks is most useful, revealing the ' +
      'explanation after each answer. This is the mode to spend most of your time in.',
    glyph: '◎',
    tracks: ['n10-009', 'hvac-controls'],
  },
  {
    id: 'weak',
    name: 'Weak Spots',
    tagline: 'Only what you keep missing',
    detail:
      'Draws the questions with the lowest mastery scores. Useful once you have a few sessions of history, ' +
      'and pointless before that.',
    glyph: '◈',
    tracks: ['n10-009', 'hvac-controls'],
  },
  {
    id: 'subnet',
    name: 'Subnet Lab',
    tagline: 'Endless generated IPv4 practice',
    detail:
      'Network and broadcast addresses, host ranges, mask translation, VLSM and address classification. ' +
      'Questions are generated from the arithmetic, so the supply never runs out.',
    glyph: '⊞',
    tracks: ['n10-009'],
  },
  {
    id: 'ports',
    name: 'Port Rush',
    tagline: 'Timed recall, three lives',
    detail:
      'Rapid-fire ports and protocols against a two-minute clock. Three wrong answers ends the run. ' +
      'Built for the kind of recall that has to be automatic.',
    glyph: '⚡',
    tracks: ['n10-009'],
  },
  {
    id: 'exam',
    name: 'Exam Simulation',
    tagline: '90 questions, 90 minutes',
    detail:
      'Domains are sampled at the published exam weightings and explanations are held back until the end, ' +
      'as on the real test. Only verified content is used.',
    glyph: '⏱',
    tracks: ['n10-009'],
  },
];

export function modeById(id: ModeId): ModeDef {
  const found = MODES.find((m) => m.id === id);
  if (!found) throw new Error(`unknown mode "${id}"`);
  return found;
}

export interface BuildOptions {
  readonly mode: ModeId;
  readonly track: Track;
  readonly pool: readonly Question[];
  readonly profile: Profile;
  /** Restrict a drill to one domain. Omit for everything. */
  readonly domain?: string;
  readonly seed?: number;
  readonly now?: number;
}

export interface BuiltSession {
  readonly config: SessionConfig;
  readonly seed: number;
}

const EXAM_QUESTIONS = 90;
const EXAM_SECONDS = 90 * 60;
const DRILL_QUESTIONS = 15;
const GENERATED_QUESTIONS = 20;

/**
 * Turns a mode choice into a concrete session.
 *
 * Each mode differs in three ways: where its questions come from, whether the
 * explanation appears immediately or at the end, and what pressure it applies.
 * Everything else is the same loop.
 */
export function buildSession(options: BuildOptions): BuiltSession {
  const seed = options.seed ?? randomSeed();
  const rng = createRng(seed);
  const now = options.now ?? Date.now();

  switch (options.mode) {
    case 'drill': {
      const eligible = filterQuestions(options.pool, {
        track: options.track.id,
        ...(options.domain ? { domain: options.domain } : {}),
      });
      // Shuffle first so the scheduler's ties are broken differently each run.
      const shuffled = rng.shuffle(eligible);
      const cards = shuffled.map((q) => cardFor(options.profile, q.id, now));
      const order = scheduleOrder(cards, now);
      const byId = new Map(shuffled.map((q) => [q.id, q]));
      const questions = order
        .map((c) => byId.get(c.id))
        .filter((q): q is Question => q !== undefined)
        .slice(0, DRILL_QUESTIONS);

      return {
        seed,
        config: { mode: 'drill', questions, revealMode: 'immediate' },
      };
    }

    case 'weak': {
      const eligible = filterQuestions(options.pool, { track: options.track.id });
      const questions = weakest(options.profile, eligible, DRILL_QUESTIONS);
      return {
        seed,
        config: { mode: 'weak', questions, revealMode: 'immediate' },
      };
    }

    case 'subnet':
      return {
        seed,
        config: {
          mode: 'subnet',
          questions: generateSubnetQuestions(rng, GENERATED_QUESTIONS),
          revealMode: 'immediate',
        },
      };

    case 'ports':
      return {
        seed,
        config: {
          mode: 'ports',
          questions: generatePortQuestions(rng, 40),
          revealMode: 'immediate',
          timeLimitSec: 120,
          lives: 3,
          scoreMultiplier: 1.5,
        },
      };

    case 'exam':
      return {
        seed,
        config: {
          mode: 'exam',
          questions: buildExam(options.track, options.pool, EXAM_QUESTIONS, rng),
          revealMode: 'deferred',
          timeLimitSec: EXAM_SECONDS,
        },
      };
  }
}

/** Why a mode cannot be started right now, or undefined if it can. */
export function unavailableReason(
  mode: ModeDef,
  track: Track,
  pool: readonly Question[],
  profile: Profile,
): string | undefined {
  if (!mode.tracks.includes(track.id)) {
    return `Not available for ${track.title}`;
  }

  const forTrack = pool.filter((q) => q.track === track.id);

  switch (mode.id) {
    case 'drill':
      return forTrack.length === 0 ? 'No questions in this track yet' : undefined;
    case 'weak': {
      const seen = forTrack.filter((q) => (profile.cards[q.id]?.totalSeen ?? 0) > 0);
      if (forTrack.length === 0) return 'No questions in this track yet';
      return seen.length < 5 ? 'Answer a few questions first' : undefined;
    }
    case 'exam': {
      const verified = forTrack.filter((q) => q.status === 'verified').length;
      return verified < 10 ? `Needs 10+ verified questions (have ${verified})` : undefined;
    }
    default:
      return undefined;
  }
}
