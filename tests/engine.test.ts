import { describe, expect, it } from 'vitest';
import { grade, describeAnswer } from '../src/engine/grade';
import { createRng } from '../src/engine/rng';
import { Session, streakMultiplier } from '../src/engine/session';
import { DEFAULT_EASE, MIN_EASE, isDue, mastery, newCard, review, scheduleOrder } from '../src/engine/srs';
import { buildExam, filterQuestions } from '../src/engine/select';
import { emptyProfile, objectiveProgress, recordReview, weakest } from '../src/engine/profile';
import type { Question } from '../src/engine/types';
import { N10_009 } from '../src/content/tracks';
import { ALL_QUESTIONS } from '../src/content';

const q = (over: Partial<Question> = {}): Question =>
  ({
    id: 'n10-009.1.1.t',
    track: 'n10-009',
    domain: '1.0',
    objective: '1.1',
    kind: 'choice',
    difficulty: 1,
    prompt: 'p',
    choices: ['a', 'b', 'c'],
    answer: 1,
    explain: 'because',
    source: { kind: 'standard', ref: 'RFC 1' },
    status: 'verified',
    ...over,
  }) as Question;

describe('grading', () => {
  it('grades a single choice', () => {
    expect(grade(q(), { kind: 'choice', index: 1 }).correct).toBe(true);
    expect(grade(q(), { kind: 'choice', index: 0 }).correct).toBe(false);
  });

  it('gives partial credit on select-all', () => {
    const question = q({ kind: 'multi', answers: [0, 1] } as Partial<Question>);
    expect(grade(question, { kind: 'multi', indices: [0, 1] }).credit).toBe(1);
    // One of two right, nothing spurious: 1 hit over a union of 2.
    expect(grade(question, { kind: 'multi', indices: [0] }).credit).toBeCloseTo(0.5);
    // Over-selecting is penalised as well as missing.
    expect(grade(question, { kind: 'multi', indices: [0, 1, 2] }).credit).toBeCloseTo(2 / 3);
    expect(grade(question, { kind: 'multi', indices: [2] }).credit).toBe(0);
  });

  it('matches typed input case- and space-insensitively', () => {
    const question = q({ kind: 'input', accept: ['192.168.1.0'] } as Partial<Question>);
    expect(grade(question, { kind: 'input', text: ' 192.168.1.0 ' }).correct).toBe(true);
    expect(grade(question, { kind: 'input', text: '192.168.1.1' }).correct).toBe(false);
  });

  it('accepts any listed spelling', () => {
    const question = q({ kind: 'input', accept: ['traceroute', 'tracert'] } as Partial<Question>);
    expect(grade(question, { kind: 'input', text: 'TRACERT' }).correct).toBe(true);
  });

  it('scores order questions by how many are in place', () => {
    const question = q({ kind: 'order', steps: ['a', 'b', 'c', 'd'] } as Partial<Question>);
    expect(grade(question, { kind: 'order', order: [0, 1, 2, 3] }).credit).toBe(1);
    expect(grade(question, { kind: 'order', order: [0, 1, 3, 2] }).credit).toBe(0.5);
    expect(grade(question, { kind: 'order', order: [3, 2, 1, 0] }).credit).toBe(0);
  });

  it('scores match questions per pair', () => {
    const question = q({
      kind: 'match',
      pairs: [
        ['a', '1'],
        ['b', '2'],
      ],
    } as Partial<Question>);
    expect(grade(question, { kind: 'match', mapping: { 0: 0, 1: 1 } }).credit).toBe(1);
    expect(grade(question, { kind: 'match', mapping: { 0: 0, 1: 0 } }).credit).toBe(0.5);
  });

  it('refuses a response of the wrong kind', () => {
    expect(() => grade(q(), { kind: 'input', text: 'x' })).toThrow(/does not match/);
  });

  it('describes the answer for the reveal panel', () => {
    expect(describeAnswer(q())).toBe('b');
  });
});

describe('seeded rng', () => {
  it('is deterministic', () => {
    const a = Array.from({ length: 20 }, () => createRng(7).int(0, 1000));
    expect(new Set(a).size).toBe(1);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('shuffles without dropping or duplicating items', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = createRng(99).shuffle(items);
    expect([...shuffled].sort((x, y) => x - y)).toEqual(items);
  });

  it('does not mutate its input', () => {
    const items = [1, 2, 3, 4, 5];
    createRng(1).shuffle(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('samples distinct items', () => {
    const picked = createRng(5).sample([1, 2, 3, 4, 5, 6], 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('caps a sample at the list length', () => {
    expect(createRng(5).sample([1, 2], 10)).toHaveLength(2);
  });
});

describe('spaced repetition', () => {
  const now = 1_700_000_000_000;

  it('walks a new card through the learning steps', () => {
    let card = newCard('x', now);
    expect(card.ease).toBe(DEFAULT_EASE);

    card = review(card, 1, now);
    expect(card.reps).toBe(1);
    expect(card.dueAt).toBe(now + 60_000);

    card = review(card, 1, now);
    expect(card.reps).toBe(2);
    expect(card.dueAt).toBe(now + 600_000);

    card = review(card, 1, now);
    expect(card.intervalDays).toBe(1);

    card = review(card, 1, now);
    expect(card.intervalDays).toBe(4);

    card = review(card, 1, now);
    expect(card.intervalDays).toBeGreaterThan(4);
  });

  it('resets and lowers ease on a lapse', () => {
    let card = newCard('x', now);
    for (let i = 0; i < 5; i++) card = review(card, 1, now);
    const easeBefore = card.ease;

    card = review(card, 0, now);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(1);
    expect(card.ease).toBeLessThan(easeBefore);
    expect(card.intervalDays).toBe(0);
  });

  it('never drops ease below the floor', () => {
    let card = newCard('x', now);
    for (let i = 0; i < 40; i++) card = review(card, 0, now);
    expect(card.ease).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('treats partial credit above the threshold as a pass', () => {
    const card = review(newCard('x', now), 0.7, now);
    expect(card.reps).toBe(1);
    expect(card.lapses).toBe(0);
  });

  it('treats partial credit below the threshold as a lapse', () => {
    const card = review(newCard('x', now), 0.4, now);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(1);
  });

  it('counts only full credit towards accuracy', () => {
    let card = review(newCard('x', now), 0.7, now);
    expect(card.totalSeen).toBe(1);
    expect(card.totalCorrect).toBe(0);
    card = review(card, 1, now);
    expect(card.totalCorrect).toBe(1);
  });

  it('puts overdue reviews before brand-new cards', () => {
    const seen = { ...newCard('seen', now), totalSeen: 3, dueAt: now - 1000 };
    const fresh = newCard('fresh', now);
    const order = scheduleOrder([fresh, seen], now);
    expect(order[0]?.id).toBe('seen');
  });

  it('knows what is due', () => {
    expect(isDue(newCard('x', now), now)).toBe(true);
    expect(isDue({ ...newCard('x', now), dueAt: now + 1000 }, now)).toBe(false);
  });

  it('reports zero mastery for an unseen card', () => {
    expect(mastery(newCard('x', now))).toBe(0);
  });

  it('raises mastery as a card matures', () => {
    let card = newCard('x', now);
    const early = (() => {
      card = review(card, 1, now);
      return mastery(card);
    })();
    for (let i = 0; i < 6; i++) card = review(card, 1, now);
    expect(mastery(card)).toBeGreaterThan(early);
  });
});

describe('session', () => {
  const questions = [q({ id: 'a' }), q({ id: 'b' }), q({ id: 'c' })];

  it('runs through every question and finishes', () => {
    const s = new Session({ mode: 'drill', questions, revealMode: 'immediate' });
    for (let i = 0; i < 3; i++) {
      expect(s.snapshot().phase).toBe('asking');
      s.answer({ kind: 'choice', index: 1 });
      expect(s.snapshot().phase).toBe(i === 2 ? 'revealed' : 'revealed');
      s.next();
    }
    expect(s.snapshot().phase).toBe('finished');
    expect(s.snapshot().correctCount).toBe(3);
  });

  it('advances immediately in deferred (exam) mode', () => {
    const s = new Session({ mode: 'exam', questions, revealMode: 'deferred' });
    s.answer({ kind: 'choice', index: 1 });
    expect(s.snapshot().index).toBe(1);
    expect(s.snapshot().phase).toBe('asking');
  });

  it('builds and resets a streak', () => {
    const s = new Session({ mode: 'drill', questions, revealMode: 'deferred' });
    s.answer({ kind: 'choice', index: 1 });
    s.answer({ kind: 'choice', index: 1 });
    expect(s.snapshot().streak).toBe(2);
    s.answer({ kind: 'choice', index: 0 });
    expect(s.snapshot().streak).toBe(0);
    expect(s.snapshot().bestStreak).toBe(2);
  });

  it('ends the run when lives are gone', () => {
    const s = new Session({ mode: 'rush', questions, revealMode: 'deferred', lives: 1 });
    s.answer({ kind: 'choice', index: 0 });
    expect(s.snapshot().phase).toBe('finished');
  });

  it('scores nothing for a wrong answer', () => {
    const s = new Session({ mode: 'drill', questions, revealMode: 'deferred' });
    s.answer({ kind: 'choice', index: 0 });
    expect(s.snapshot().score).toBe(0);
  });

  it('caps the streak multiplier', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(3)).toBe(1.25);
    expect(streakMultiplier(100)).toBe(3);
  });

  it('counts a skip as wrong', () => {
    const s = new Session({ mode: 'drill', questions, revealMode: 'immediate' });
    s.skip();
    expect(s.snapshot().answered[0]?.judgement.correct).toBe(false);
    expect(s.snapshot().phase).toBe('revealed');
  });

  it('reports remaining time only when timed', () => {
    const untimed = new Session({ mode: 'drill', questions, revealMode: 'immediate' });
    expect(untimed.timeLeftSec()).toBeUndefined();

    const start = 1000;
    const timed = new Session(
      { mode: 'exam', questions, revealMode: 'deferred', timeLimitSec: 60 },
      start,
    );
    expect(timed.timeLeftSec(start + 10_000)).toBe(50);
    expect(timed.timeLeftSec(start + 999_000)).toBe(0);
  });

  it('refuses to start with no questions', () => {
    expect(() => new Session({ mode: 'x', questions: [], revealMode: 'immediate' })).toThrow();
  });

  it('refuses an answer after the reveal', () => {
    const s = new Session({ mode: 'drill', questions, revealMode: 'immediate' });
    s.answer({ kind: 'choice', index: 1 });
    expect(() => s.answer({ kind: 'choice', index: 1 })).toThrow(/phase/);
  });
});

describe('exam construction', () => {
  it('produces the requested number of questions', () => {
    const paper = buildExam(N10_009, ALL_QUESTIONS, 20, createRng(1));
    expect(paper).toHaveLength(20);
  });

  it('never repeats a question', () => {
    const paper = buildExam(N10_009, ALL_QUESTIONS, 30, createRng(3));
    expect(new Set(paper.map((p) => p.id)).size).toBe(paper.length);
  });

  it('draws only verified content', () => {
    const paper = buildExam(N10_009, ALL_QUESTIONS, 30, createRng(9));
    expect(paper.every((p) => p.status === 'verified')).toBe(true);
  });

  it('weights domains towards the published percentages', () => {
    // With a large bank this converges; with a small one, backfill fills the gaps.
    const bank = N10_009.domains.flatMap((d) =>
      Array.from({ length: 40 }, (_, i) =>
        q({
          id: `n10-009.${d.id}.bulk.${i}`,
          domain: d.id,
          objective: d.objectives[0]!.id,
        }),
      ),
    );
    const paper = buildExam(N10_009, bank, 100, createRng(11));
    for (const domain of N10_009.domains) {
      const got = paper.filter((p) => p.domain === domain.id).length;
      expect(Math.abs(got - domain.examWeight)).toBeLessThanOrEqual(1);
    }
  });

  it('filters by domain and objective', () => {
    const only = filterQuestions(ALL_QUESTIONS, { track: 'n10-009', domain: '5.0' });
    expect(only.length).toBeGreaterThan(0);
    expect(only.every((x) => x.domain === '5.0')).toBe(true);
  });
});

describe('profile', () => {
  const now = 1_700_000_000_000;

  it('records reviews against the right card', () => {
    const p = recordReview(emptyProfile(), 'q1', 1, now);
    expect(p.cards['q1']?.totalSeen).toBe(1);
  });

  it('summarises progress per objective', () => {
    let p = emptyProfile();
    p = recordReview(p, ALL_QUESTIONS[0]!.id, 1, now);
    const progress = objectiveProgress(p, ALL_QUESTIONS);
    const target = progress.find((x) => x.objective === ALL_QUESTIONS[0]!.objective);
    expect(target?.seen).toBe(1);
  });

  it('surfaces missed questions ahead of unseen ones', () => {
    let p = emptyProfile();
    const missed = ALL_QUESTIONS[0]!;
    p = recordReview(p, missed.id, 0, now);
    expect(weakest(p, ALL_QUESTIONS, 1)[0]?.id).toBe(missed.id);
  });
});
