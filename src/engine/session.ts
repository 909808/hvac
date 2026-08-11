import { grade } from './grade';
import type { Judgement, Question, Response } from './types';

export type SessionPhase = 'asking' | 'revealed' | 'finished';

export interface SessionConfig {
  readonly mode: string;
  readonly questions: readonly Question[];
  /** Seconds for the whole session. Omit for untimed play. */
  readonly timeLimitSec?: number;
  /** Wrong answers allowed before the run ends. Omit for unlimited. */
  readonly lives?: number;
  /**
   * Exam mode defers every explanation to the end, the way the real test does.
   * Practice modes reveal immediately, which is how you actually learn.
   */
  readonly revealMode: 'immediate' | 'deferred';
  /** Multiplies the base score. Arcade modes run hot. */
  readonly scoreMultiplier?: number;
}

export interface AnsweredItem {
  readonly question: Question;
  readonly response: Response;
  readonly judgement: Judgement;
  readonly points: number;
  readonly elapsedMs: number;
}

export interface SessionSnapshot {
  readonly phase: SessionPhase;
  readonly index: number;
  readonly total: number;
  readonly question: Question | undefined;
  readonly score: number;
  readonly streak: number;
  readonly bestStreak: number;
  readonly livesLeft: number | undefined;
  readonly answered: readonly AnsweredItem[];
  readonly lastJudgement: Judgement | undefined;
  readonly correctCount: number;
}

const BASE_POINTS: Record<1 | 2 | 3, number> = { 1: 100, 2: 150, 3: 220 };

/** Streak multiplier caps at 3x so a hot run does not swamp everything else. */
export function streakMultiplier(streak: number): number {
  return Math.min(3, 1 + Math.floor(streak / 3) * 0.25);
}

/**
 * The game loop, with no reference to the DOM. Everything the UI shows comes
 * from `snapshot()`, and everything the player does goes through `answer()` and
 * `next()`. Keeping it this way is what lets the engine be unit-tested and,
 * later, reused for the HVAC track without change.
 */
export class Session {
  readonly config: SessionConfig;
  private readonly startedAt: number;

  private index = 0;
  private phase: SessionPhase = 'asking';
  private score = 0;
  private streak = 0;
  private best = 0;
  private lives: number | undefined;
  private readonly answered: AnsweredItem[] = [];
  private lastJudgement: Judgement | undefined;
  private questionShownAt: number;

  constructor(config: SessionConfig, now: number = Date.now()) {
    if (config.questions.length === 0) {
      throw new Error(`cannot start session "${config.mode}" with no questions`);
    }
    this.config = config;
    this.startedAt = now;
    this.questionShownAt = now;
    this.lives = config.lives;
  }

  snapshot(): SessionSnapshot {
    return {
      phase: this.phase,
      index: this.index,
      total: this.config.questions.length,
      question: this.config.questions[this.index],
      score: this.score,
      streak: this.streak,
      bestStreak: this.best,
      livesLeft: this.lives,
      answered: this.answered,
      lastJudgement: this.lastJudgement,
      correctCount: this.answered.filter((a) => a.judgement.correct).length,
    };
  }

  /** Seconds left, or undefined for untimed sessions. */
  timeLeftSec(now: number = Date.now()): number | undefined {
    if (this.config.timeLimitSec === undefined) return undefined;
    const elapsed = (now - this.startedAt) / 1000;
    return Math.max(0, Math.ceil(this.config.timeLimitSec - elapsed));
  }

  answer(response: Response, now: number = Date.now()): Judgement {
    if (this.phase !== 'asking') {
      throw new Error(`answer() called while phase is "${this.phase}"`);
    }
    const question = this.config.questions[this.index];
    if (!question) throw new Error('answer() called with no current question');

    const judgement = grade(question, response);
    const elapsedMs = now - this.questionShownAt;

    if (judgement.correct) {
      this.streak++;
      this.best = Math.max(this.best, this.streak);
    } else {
      this.streak = 0;
      if (this.lives !== undefined) this.lives--;
    }

    const points = this.pointsFor(question, judgement);
    this.score += points;

    this.answered.push({ question, response, judgement, points, elapsedMs });
    this.lastJudgement = judgement;
    this.phase = this.config.revealMode === 'immediate' ? 'revealed' : 'asking';

    if (this.config.revealMode === 'deferred') this.advance(now);
    if (this.lives !== undefined && this.lives <= 0) this.phase = 'finished';

    return judgement;
  }

  /** Move past the reveal panel to the next question. */
  next(now: number = Date.now()): void {
    if (this.phase === 'finished') return;
    if (this.phase !== 'revealed') {
      throw new Error(`next() called while phase is "${this.phase}"`);
    }
    this.advance(now);
  }

  /** Give up on the current question without guessing. Counts as wrong. */
  skip(now: number = Date.now()): void {
    const question = this.config.questions[this.index];
    if (!question || this.phase !== 'asking') return;
    this.streak = 0;
    if (this.lives !== undefined) this.lives--;
    this.answered.push({
      question,
      response: emptyResponse(question),
      judgement: { correct: false, credit: 0, wrongParts: [] },
      points: 0,
      elapsedMs: now - this.questionShownAt,
    });
    this.lastJudgement = { correct: false, credit: 0, wrongParts: [] };
    this.phase = this.config.revealMode === 'immediate' ? 'revealed' : 'asking';
    if (this.config.revealMode === 'deferred') this.advance(now);
    if (this.lives !== undefined && this.lives <= 0) this.phase = 'finished';
  }

  /** Ends the run early — the timer expiring, or the player bailing out. */
  finish(): void {
    this.phase = 'finished';
  }

  private advance(now: number): void {
    this.index++;
    this.questionShownAt = now;
    this.phase = this.index >= this.config.questions.length ? 'finished' : 'asking';
  }

  private pointsFor(question: Question, judgement: Judgement): number {
    if (judgement.credit <= 0) return 0;
    const base = BASE_POINTS[question.difficulty];
    const multiplier = streakMultiplier(this.streak) * (this.config.scoreMultiplier ?? 1);
    return Math.round(base * judgement.credit * multiplier);
  }
}

function emptyResponse(question: Question): Response {
  switch (question.kind) {
    case 'choice':
      return { kind: 'choice', index: -1 };
    case 'multi':
      return { kind: 'multi', indices: [] };
    case 'input':
      return { kind: 'input', text: '' };
    case 'order':
      return { kind: 'order', order: [] };
    case 'match':
      return { kind: 'match', mapping: {} };
  }
}
