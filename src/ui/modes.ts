import { createRng, randomSeed } from '@engine/rng';
import type { SessionConfig } from '@engine/session';
import { buildExam, filterQuestions } from '@engine/select';
import { weakest, type Profile } from '@engine/profile';
import { cardFor } from '@engine/profile';
import { scheduleOrder } from '@engine/srs';
import type { Question, Track } from '@engine/types';
import { generatePortQuestions } from '@games/portrush';
import { generateSubnetQuestions } from '@games/subnet';

import { generateDrill, generateMixedDrill, type DrillLabId } from '@games/hvac/drills';

export type ModeId =
  | 'drill'
  | 'weak'
  | 'exam'
  // Network+ labs
  | 'subnet'
  | 'ports'
  // HVAC
  | 'checkpoint'
  | 'service-call'
  | DrillLabId;

export interface ModeDef {
  readonly id: ModeId;
  readonly name: string;
  readonly tagline: string;
  readonly detail: string;
  readonly glyph: string;
  /** Only offered for tracks that have the content this mode needs. */
  readonly tracks: readonly string[];
}

/** HVAC lab modes, shown once their sector is reached. */
export const LAB_MODES: readonly ModeDef[] = [
  {
    id: 'service-call',
    name: 'Service Call',
    tagline: 'Diagnose a live system',
    detail:
      'A customer complaint and a system with something wrong. Choose what to measure, watch the ' +
      'clock, then commit to a diagnosis. Readings come from a physical model, so the signatures ' +
      'behave the way they do on real equipment.',
    glyph: '🔧',
    tracks: ['hvac'],
  },
  {
    id: 'pt-chart',
    name: 'P-T Chart',
    tagline: 'Pressure ↔ temperature, both ways',
    detail:
      'Convert between gauge pressure and saturation temperature for R-22, R-410A and R-134a until ' +
      'it is automatic. Generated from the tables, so the supply never runs out.',
    glyph: '🌡',
    tracks: ['hvac'],
  },
  {
    id: 'superheat-subcooling',
    name: 'Superheat & Subcooling',
    tagline: 'The two numbers that matter',
    detail:
      'Calculate both from gauge and thermometer readings, then read the pairings — high superheat ' +
      'with low subcooling versus high with high — that separate an undercharge from a restriction.',
    glyph: '♻',
    tracks: ['hvac'],
  },
  {
    id: 'psychrometrics',
    name: 'Psych Lab',
    tagline: 'Air properties from any two readings',
    detail:
      'Dry bulb and wet bulb in, relative humidity, dew point, grains and enthalpy out. Computed ' +
      'from the ASHRAE equations rather than read off a chart.',
    glyph: '📊',
    tracks: ['hvac'],
  },
  {
    id: 'heat-load',
    name: 'Heat Formulas',
    tagline: '1.08, 0.68, 4.5 and 500',
    detail:
      'Sensible, latent, total and hydronic heat until the constants come without thinking. These ' +
      'are the formulas behind every capacity calculation on the job.',
    glyph: '🔥',
    tracks: ['hvac'],
  },
  {
    id: 'airflow',
    name: 'Airflow Bench',
    tagline: 'CFM, static pressure and the fan laws',
    detail:
      'CFM per ton, total external static, friction rate, and the three fan laws — including the ' +
      'cube law that burns out blower motors.',
    glyph: '💨',
    tracks: ['hvac'],
  },
  {
    id: 'electrical',
    name: 'Electrical Bench',
    tagline: "Ohm's law, circuits and capacitors",
    detail:
      'Current, power, series and parallel resistance, and judging a run capacitor against its ' +
      'tolerance band.',
    glyph: '⚡',
    tracks: ['hvac'],
  },
];

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

const CHECKPOINT_MODE: ModeDef = {
  id: 'checkpoint',
  name: 'Checkpoint',
  tagline: 'Pass to unlock the next sector',
  detail: 'A graded test over this sector. Explanations are held until the end.',
  glyph: '🎯',
  tracks: ['hvac'],
};

export function modeById(id: ModeId): ModeDef {
  const found =
    [...MODES, ...LAB_MODES].find((m) => m.id === id) ??
    (id === 'checkpoint' ? CHECKPOINT_MODE : undefined);
  if (!found) throw new Error(`unknown mode "${id}"`);
  return found;
}

export function labModesFor(unlocked: ReadonlySet<string>, trackId: string): ModeDef[] {
  return LAB_MODES.filter((m) => m.tracks.includes(trackId) && unlocked.has(m.id));
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

    case 'checkpoint': {
      const sector = options.track.sectors?.find((s) => s.id === options.domain);
      const authored = filterQuestions(options.pool, {
        track: options.track.id,
        ...(options.domain ? { domain: options.domain } : {}),
      });

      const wanted = sector?.checkpoint.questions ?? 10;
      const picked = rng.sample(authored, wanted);

      // Top up from the generated drills this sector owns, so a checkpoint is
      // never short just because the authored bank is still thin.
      if (picked.length < wanted && sector) {
        const labs = sector.labs.filter((l): l is DrillLabId => l !== 'service-call');
        for (const lab of labs) {
          if (picked.length >= wanted) break;
          picked.push(...generateDrill(lab, rng, wanted - picked.length));
        }
      }

      return {
        seed,
        config: {
          mode: 'checkpoint',
          questions: rng.shuffle(picked).slice(0, wanted),
          revealMode: 'deferred',
        },
      };
    }

    case 'service-call':
      // Handled by its own screen rather than the question session loop.
      throw new Error('service-call does not build a question session');

    case 'pt-chart':
    case 'superheat-subcooling':
    case 'psychrometrics':
    case 'heat-load':
    case 'airflow':
    case 'electrical':
      return {
        seed,
        config: {
          mode: options.mode,
          questions: generateDrill(options.mode, rng, GENERATED_QUESTIONS),
          revealMode: 'immediate',
        },
      };
  }
}

/** A mixed calculation workout across every HVAC drill generator. */
export function buildMixedDrill(seed: number): BuiltSession {
  const rng = createRng(seed);
  return {
    seed,
    config: {
      mode: 'drill',
      questions: generateMixedDrill(rng, GENERATED_QUESTIONS),
      revealMode: 'immediate',
    },
  };
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
