import type { Rng } from './rng';
import type { Question, Track } from './types';

/**
 * Build an exam paper whose domain mix matches the real thing.
 *
 * CompTIA publishes the weighting for each domain, so a practice exam that
 * draws uniformly across a question bank misrepresents the test — you would
 * over-practise whichever domain you happened to write the most questions for.
 * This allocates seats by weight first, then fills them.
 */
export function buildExam(
  track: Track,
  pool: readonly Question[],
  count: number,
  rng: Rng,
): Question[] {
  const eligible = pool.filter((q) => q.track === track.id && q.status === 'verified');

  const byDomain = new Map<string, Question[]>();
  for (const q of eligible) {
    const list = byDomain.get(q.domain) ?? [];
    list.push(q);
    byDomain.set(q.domain, list);
  }

  // Largest-remainder allocation, so the seats sum exactly to `count`.
  const quotas = track.domains.map((d) => ({
    domain: d.id,
    exact: (d.examWeight / 100) * count,
    seats: Math.floor((d.examWeight / 100) * count),
  }));
  let allocated = quotas.reduce((sum, q) => sum + q.seats, 0);
  const byRemainder = [...quotas].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)),
  );
  let i = 0;
  while (allocated < count && byRemainder.length > 0) {
    byRemainder[i % byRemainder.length]!.seats++;
    allocated++;
    i++;
  }

  const paper: Question[] = [];
  const shortfalls: number[] = [];

  for (const quota of quotas) {
    const available = byDomain.get(quota.domain) ?? [];
    const take = rng.sample(available, quota.seats);
    paper.push(...take);
    if (take.length < quota.seats) shortfalls.push(quota.seats - take.length);
  }

  // If a domain is thin on content, backfill from everything not already used
  // rather than shrinking the paper.
  const shortfall = shortfalls.reduce((a, b) => a + b, 0);
  if (shortfall > 0) {
    const used = new Set(paper.map((q) => q.id));
    const rest = eligible.filter((q) => !used.has(q.id));
    paper.push(...rng.sample(rest, shortfall));
  }

  return rng.shuffle(paper);
}

export interface FilterOptions {
  readonly track: string;
  readonly domain?: string;
  readonly objective?: string;
  /** Exam mode passes 'verified'; practice modes accept drafts too. */
  readonly minStatus?: 'verified' | 'any';
  readonly kinds?: readonly Question['kind'][];
}

export function filterQuestions(
  pool: readonly Question[],
  options: FilterOptions,
): Question[] {
  return pool.filter((q) => {
    if (q.track !== options.track) return false;
    if (options.domain && q.domain !== options.domain) return false;
    if (options.objective && q.objective !== options.objective) return false;
    if (options.minStatus === 'verified' && q.status !== 'verified') return false;
    if (options.kinds && !options.kinds.includes(q.kind)) return false;
    return true;
  });
}
