import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS, BOOKS, TRACKS, auditContent, contentStats } from '../src/content';
import { formatReport } from '../src/engine/validate';
import { validateContent } from '../src/engine/validate';
import { createRng } from '../src/engine/rng';
import { generateSubnetQuestions } from '../src/games/subnet';
import { generatePortQuestions } from '../src/games/portrush';

/**
 * The safety net. If you paste in a question with an answer index off by one, a
 * duplicate id, or a citation to a book that is not registered, this fails.
 */
describe('authored content', () => {
  it('passes validation with no errors', () => {
    const report = auditContent();
    if (!report.ok) throw new Error(`\n${formatReport(report)}`);
    expect(report.errors).toHaveLength(0);
  });

  it('has no warnings', () => {
    const report = auditContent();
    if (report.warnings.length > 0) throw new Error(`\n${formatReport(report)}`);
    expect(report.warnings).toHaveLength(0);
  });

  it('gives every question a unique id', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never marks an uncited question as verified', () => {
    const offenders = ALL_QUESTIONS.filter(
      (q) => q.status === 'verified' && q.source.kind === 'uncited',
    );
    expect(offenders.map((q) => q.id)).toEqual([]);
  });

  it('has enough verified content for every domain to appear in an exam', () => {
    const netplus = ALL_QUESTIONS.filter((q) => q.track === 'n10-009' && q.status === 'verified');
    for (const domain of TRACKS[0]!.domains) {
      const count = netplus.filter((q) => q.domain === domain.id).length;
      expect(count, `domain ${domain.id} has no verified questions`).toBeGreaterThan(0);
    }
  });

  it('reports stats that match the question list', () => {
    const stats = contentStats();
    expect(stats.total).toBe(ALL_QUESTIONS.length);
    expect(stats.verified + stats.draft).toBe(stats.total);
  });
});

describe('validator', () => {
  const track = TRACKS[0]!;
  const good = {
    id: 'n10-009.1.1.example',
    track: 'n10-009',
    domain: '1.0',
    objective: '1.1',
    kind: 'choice',
    difficulty: 1,
    prompt: 'Example prompt?',
    choices: ['a', 'b', 'c'],
    answer: 0,
    explain: 'A sufficiently long explanation that says why, not merely what.',
    source: { kind: 'standard', ref: 'RFC 1' },
    status: 'verified',
  } as const;

  const check = (question: unknown) =>
    validateContent({
      tracks: [track],
      books: BOOKS,
      // Deliberately bypassing the compile-time guard to test the runtime one.
      questions: [question as never],
    });

  it('accepts a well-formed question', () => {
    expect(check(good).ok).toBe(true);
  });

  it('catches an out-of-range answer index', () => {
    const report = check({ ...good, answer: 3 });
    expect(report.ok).toBe(false);
    expect(report.errors[0]?.message).toMatch(/out of range/);
  });

  it('catches an objective that does not exist', () => {
    const report = check({ ...good, objective: '1.99' });
    expect(report.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
  });

  it('catches an objective filed under the wrong domain', () => {
    const report = check({ ...good, domain: '2.0' });
    expect(report.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
  });

  it('catches duplicate choices', () => {
    const report = check({ ...good, choices: ['a', 'A', 'b'] });
    expect(report.errors.some((e) => e.message.includes('duplicates'))).toBe(true);
  });

  it('catches a citation to an unregistered book', () => {
    const report = check({ ...good, source: { kind: 'book', book: 'nope-1e', pages: '12' } });
    expect(report.errors.some((e) => e.message.includes('unknown book'))).toBe(true);
  });

  it('catches a verified question with no citation', () => {
    const report = check({ ...good, source: { kind: 'uncited', note: 'todo' } });
    expect(report.errors.some((e) => e.message.includes('no citation'))).toBe(true);
  });

  it('catches a duplicate id', () => {
    const report = validateContent({
      tracks: [track],
      books: BOOKS,
      questions: [good as never, good as never],
    });
    expect(report.errors.some((e) => e.message.includes('duplicate question id'))).toBe(true);
  });

  it('catches a multi question where every choice is correct', () => {
    const report = check({
      ...good,
      kind: 'multi',
      answers: [0, 1, 2],
    });
    expect(report.errors.some((e) => e.message.includes('cannot discriminate'))).toBe(true);
  });

  it('catches a match question with ambiguous right-hand items', () => {
    const report = check({
      ...good,
      kind: 'match',
      pairs: [
        ['a', 'same'],
        ['b', 'same'],
      ],
    });
    expect(report.errors.some((e) => e.message.includes('ambiguous'))).toBe(true);
  });

  it('catches a topology link pointing at a missing node', () => {
    const report = check({
      ...good,
      topology: {
        nodes: [{ id: 'a', kind: 'pc', label: 'A', col: 0, row: 0 }],
        links: [{ from: 'a', to: 'ghost' }],
      },
    });
    expect(report.errors.some((e) => e.message.includes('unknown node'))).toBe(true);
  });

  it('warns when domain weights do not sum to 100', () => {
    const report = validateContent({
      tracks: [{ ...track, domains: [{ ...track.domains[0]!, examWeight: 50 }] }],
      books: BOOKS,
      questions: [],
    });
    expect(report.warnings.some((w) => w.message.includes('sum to'))).toBe(true);
  });
});

/**
 * Generated questions bypass hand-authoring, so the thing to prove is that the
 * generators cannot emit something structurally broken — an answer index out of
 * range, colliding distractors, an ambiguous match table.
 */
describe('generated content', () => {
  it('produces valid subnetting questions across many seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const questions = generateSubnetQuestions(createRng(seed), 22);
      const report = validateContent({ tracks: TRACKS, books: BOOKS, questions });
      if (!report.ok) throw new Error(`seed ${seed}:\n${formatReport(report)}`);
    }
  });

  it('produces valid port questions across many seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const questions = generatePortQuestions(createRng(seed), 18);
      const report = validateContent({ tracks: TRACKS, books: BOOKS, questions });
      if (!report.ok) throw new Error(`seed ${seed}:\n${formatReport(report)}`);
    }
  });

  it('is reproducible from a seed', () => {
    const a = generateSubnetQuestions(createRng(4242), 12);
    const b = generateSubnetQuestions(createRng(4242), 12);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('never offers the correct answer twice in one choice list', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const q of generateSubnetQuestions(createRng(seed), 22)) {
        if (q.kind === 'choice') {
          expect(new Set(q.choices).size, `seed ${seed}, ${q.id}`).toBe(q.choices.length);
        }
      }
    }
  });
});
