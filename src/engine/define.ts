import type { Question, Source, Track, BookRef } from './types';

/** Sources that count as a real citation. `uncited` is deliberately excluded. */
export type CitedSource = Extract<
  Source,
  { kind: 'book' } | { kind: 'standard' } | { kind: 'generated' }
>;

/**
 * Compile-time rule: marking something `verified` requires a citation.
 *
 * Intersected into the parameter type of `defineQuestion`, so an item with
 * `status: 'verified'` and an `uncited` source fails to typecheck at the call
 * site rather than at review time.
 */
type RequiresCitation<Q> = Q extends { status: 'verified' } ? { source: CitedSource } : unknown;

/**
 * Wrap every authored question in this. It is an identity function at runtime;
 * its job is to pin literal types (so `answer: 0` stays `0`, not `number`) and
 * to enforce the citation rule above.
 *
 * @example
 * defineQuestion({
 *   id: 'n10-009.1.4.dhcp-relay',
 *   track: 'n10-009',
 *   domain: '1.0',
 *   objective: '1.4',
 *   kind: 'choice',
 *   difficulty: 2,
 *   prompt: 'Clients on VLAN 20 never receive an address…',
 *   choices: ['Configure an IP helper-address on the SVI', '…'],
 *   answer: 0,
 *   explain: 'DHCPDISCOVER is a broadcast and routers do not forward broadcasts…',
 *   source: { kind: 'book', book: 'meyers-9e', pages: '312-314' },
 *   status: 'verified',
 * })
 */
export function defineQuestion<const Q extends Question>(q: Q & RequiresCitation<Q>): Q {
  return q as Q;
}

/** Convenience for a whole file of questions. Same rules, applied per item. */
export function defineQuestions<const QS extends readonly Question[]>(qs: QS): QS {
  return qs;
}

export function defineTrack<const T extends Track>(t: T): T {
  return t;
}

export function defineBook<const B extends BookRef>(b: B): B {
  return b;
}

type BookSource = Extract<Source, { kind: 'book' }>;
type StandardSource = Extract<Source, { kind: 'standard' }>;
type GeneratedSource = Extract<Source, { kind: 'generated' }>;
type UncitedSource = Extract<Source, { kind: 'uncited' }>;

/**
 * Shorthand for the common citation forms, to keep content files terse.
 *
 * Each helper returns its precise variant rather than the `Source` union, which
 * is what lets `defineQuestion` tell a cited item from an uncited one.
 */
export const cite = {
  book: (book: string, pages: string, note?: string): BookSource =>
    note === undefined ? { kind: 'book', book, pages } : { kind: 'book', book, pages, note },
  standard: (ref: string, note?: string): StandardSource =>
    note === undefined ? { kind: 'standard', ref } : { kind: 'standard', ref, note },
  generated: (generator: string): GeneratedSource => ({ kind: 'generated', generator }),
  /**
   * Use while drafting. An item citing this cannot be marked `verified`, so it
   * will never reach exam mode until you add a real page reference.
   */
  todo: (note: string): UncitedSource => ({ kind: 'uncited', note }),
} as const;
