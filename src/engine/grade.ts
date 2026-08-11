import type { Judgement, Question, Response } from './types';
import { normaliseInput } from './validate';

/**
 * Grade a response. Partial credit matters here: a "select all that apply" with
 * three of four right is a genuinely different signal from one that is entirely
 * wrong, and the scheduler uses the difference to decide how soon to ask again.
 */
export function grade(question: Question, response: Response): Judgement {
  if (question.kind !== response.kind) {
    throw new Error(
      `response kind "${response.kind}" does not match question kind "${question.kind}" (${question.id})`,
    );
  }

  switch (question.kind) {
    case 'choice': {
      const r = response as Extract<Response, { kind: 'choice' }>;
      const correct = r.index === question.answer;
      return { correct, credit: correct ? 1 : 0, wrongParts: correct ? [] : [r.index] };
    }

    case 'multi': {
      const r = response as Extract<Response, { kind: 'multi' }>;
      const expected = new Set(question.answers);
      const got = new Set(r.indices);

      const hits = [...expected].filter((i) => got.has(i)).length;
      const falsePositives = [...got].filter((i) => !expected.has(i));
      const misses = [...expected].filter((i) => !got.has(i));

      // Jaccard-style: reward hits, penalise both misses and over-selection.
      const union = new Set([...expected, ...got]).size;
      const credit = union === 0 ? 0 : hits / union;

      return {
        correct: falsePositives.length === 0 && misses.length === 0,
        credit,
        wrongParts: [...falsePositives, ...misses],
      };
    }

    case 'input': {
      const r = response as Extract<Response, { kind: 'input' }>;
      const given = normaliseInput(r.text);

      if (question.accept.some((a) => normaliseInput(a) === given)) {
        return { correct: true, credit: 1, wrongParts: [] };
      }

      if (question.tolerance !== undefined) {
        const expected = parseNumeric(question.accept[0] ?? '');
        const actual = parseNumeric(r.text);
        if (expected !== undefined && actual !== undefined) {
          const correct = Math.abs(actual - expected) <= question.tolerance;
          return { correct, credit: correct ? 1 : 0, wrongParts: [] };
        }
      }

      return { correct: false, credit: 0, wrongParts: [] };
    }

    case 'order': {
      const r = response as Extract<Response, { kind: 'order' }>;
      const n = question.steps.length;
      // `order` is the player's arrangement expressed as original indices.
      const wrongParts = r.order.flatMap((original, position) =>
        original === position ? [] : [position],
      );
      const inPlace = n - wrongParts.length;
      return {
        correct: wrongParts.length === 0 && r.order.length === n,
        credit: n === 0 ? 0 : inPlace / n,
        wrongParts,
      };
    }

    case 'match': {
      const r = response as Extract<Response, { kind: 'match' }>;
      const n = question.pairs.length;
      const wrongParts: number[] = [];
      let hits = 0;
      for (let i = 0; i < n; i++) {
        if (r.mapping[i] === i) hits++;
        else wrongParts.push(i);
      }
      return { correct: hits === n, credit: n === 0 ? 0 : hits / n, wrongParts };
    }
  }
}

/**
 * Pull a number out of a typed answer, tolerating the ways people actually
 * write them: thousands separators, a trailing unit, a leading symbol.
 * Returns undefined if there is no single unambiguous number in there.
 */
export function parseNumeric(text: string): number | undefined {
  const cleaned = text.trim().replace(/,/g, '');
  const match = /^[^\d+-]*([+-]?\d*\.?\d+)/.exec(cleaned);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

/** Renders the correct answer for the review panel, whatever the kind. */
export function describeAnswer(question: Question): string {
  switch (question.kind) {
    case 'choice':
      return question.choices[question.answer] ?? '(missing choice)';
    case 'multi':
      return question.answers
        .map((i) => question.choices[i] ?? '(missing choice)')
        .join('  ·  ');
    case 'input':
      return question.accept[0] ?? '(nothing accepted)';
    case 'order':
      return question.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    case 'match':
      return question.pairs.map(([l, r]) => `${l} → ${r}`).join('\n');
  }
}
