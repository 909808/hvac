import type { Question } from '@engine/types';
import { validateContent, type ValidationReport } from '@engine/validate';
import { BOOKS } from './books';
import { TRACKS } from './tracks';
import { DOMAIN_1_QUESTIONS } from './network-plus/domain-1-concepts';
import { DOMAIN_2_QUESTIONS } from './network-plus/domain-2-implementation';
import { DOMAIN_3_QUESTIONS } from './network-plus/domain-3-operations';
import { DOMAIN_4_QUESTIONS } from './network-plus/domain-4-security';
import { DOMAIN_5_QUESTIONS } from './network-plus/domain-5-troubleshooting';
import { HVAC_QUESTIONS } from './hvac';

/**
 * Every authored question in one list.
 *
 * Add a new content file by importing it and appending it here. The validator
 * runs over this list in the test suite, so a mistake in a new file fails
 * `npm test` rather than reaching a study session.
 */
export const ALL_QUESTIONS: readonly Question[] = [
  ...DOMAIN_1_QUESTIONS,
  ...DOMAIN_2_QUESTIONS,
  ...DOMAIN_3_QUESTIONS,
  ...DOMAIN_4_QUESTIONS,
  ...DOMAIN_5_QUESTIONS,
  ...HVAC_QUESTIONS,
];

export { BOOKS } from './books';
export { TRACKS, N10_009, HVAC, trackById, objectiveTitle, domainTitle } from './tracks';

export function auditContent(): ValidationReport {
  return validateContent({ tracks: TRACKS, books: BOOKS, questions: ALL_QUESTIONS });
}

export interface ContentStats {
  readonly total: number;
  readonly verified: number;
  readonly draft: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly citedToBook: number;
  readonly citedToStandard: number;
  readonly uncited: number;
}

export function contentStats(questions: readonly Question[] = ALL_QUESTIONS): ContentStats {
  const byKind: Record<string, number> = {};
  let citedToBook = 0;
  let citedToStandard = 0;
  let uncited = 0;

  for (const q of questions) {
    byKind[q.kind] = (byKind[q.kind] ?? 0) + 1;
    if (q.source.kind === 'book') citedToBook++;
    else if (q.source.kind === 'standard') citedToStandard++;
    else if (q.source.kind === 'uncited') uncited++;
  }

  return {
    total: questions.length,
    verified: questions.filter((q) => q.status === 'verified').length,
    draft: questions.filter((q) => q.status === 'draft').length,
    byKind,
    citedToBook,
    citedToStandard,
    uncited,
  };
}
