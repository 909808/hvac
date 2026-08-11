/**
 * Content model for the trainer.
 *
 * Design rule: every authored fact must carry a citation. The type system makes
 * an uncited item impossible to mark `verified`, and `verified` is the only
 * status that exam mode will draw from. That is the whole defence against
 * studying something that is subtly wrong.
 */

// ---------------------------------------------------------------------------
// Tracks and objectives
// ---------------------------------------------------------------------------

/**
 * A track is a body of knowledge. Network+ is the first; HVAC controls will be
 * added alongside it without touching the engine.
 */
export type TrackId = 'n10-009' | 'hvac-controls';

/** Domain within a track, e.g. Network+ domain "1.0" Networking Concepts. */
export interface Domain {
  readonly id: string;
  readonly title: string;
  /** Share of the real exam, as a percentage. Used to weight exam simulations. */
  readonly examWeight: number;
  readonly objectives: readonly Objective[];
}

/** A numbered objective inside a domain, e.g. "1.4". */
export interface Objective {
  readonly id: string;
  readonly title: string;
}

export interface Track {
  readonly id: TrackId;
  readonly title: string;
  readonly subtitle: string;
  /** Exam code or revision this content targets, shown in the UI. */
  readonly revision: string;
  readonly domains: readonly Domain[];
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/** A book you own, registered in `src/content/books.ts`. */
export interface BookRef {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly edition: string;
  readonly isbn13: string;
  readonly publisher: string;
  /** Exam revision the book was written for. Flagged in the UI if it is stale. */
  readonly targets: string;
}

/**
 * Where a piece of content came from.
 *
 * `book` is the one to use when transcribing from a study guide — it records
 * the page so any future reader can re-check the claim. `standard` is for facts
 * that come from an RFC, IEEE spec or IANA registry, which are more
 * authoritative than any study guide. `generated` marks content whose answer is
 * computed rather than written down, so there is nothing to cite.
 */
export type Source =
  | { readonly kind: 'book'; readonly book: string; readonly pages: string; readonly note?: string }
  | { readonly kind: 'standard'; readonly ref: string; readonly note?: string }
  | { readonly kind: 'generated'; readonly generator: string }
  | { readonly kind: 'uncited'; readonly note: string };

/**
 * `verified` items are cited to a book or a standard and are eligible for exam
 * mode. `draft` items still work in practice modes but are badged in the UI so
 * you always know what you are looking at.
 */
export type ContentStatus = 'verified' | 'draft';

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type Difficulty = 1 | 2 | 3;

interface QuestionBase {
  /** Stable, unique, dotted id. Convention: `<track>.<objective>.<slug>`. */
  readonly id: string;
  readonly track: TrackId;
  readonly domain: string;
  readonly objective: string;
  readonly difficulty: Difficulty;
  readonly prompt: string;
  /** Shown after answering, right or wrong. This is where the learning happens. */
  readonly explain: string;
  readonly source: Source;
  readonly status: ContentStatus;
  readonly tags?: readonly string[];
  /** Optional network diagram rendered above the prompt. */
  readonly topology?: Topology;
}

/** One correct answer out of several. */
export interface ChoiceQuestion extends QuestionBase {
  readonly kind: 'choice';
  readonly choices: readonly string[];
  /** Index into `choices`. Validated to be in range. */
  readonly answer: number;
  /** Optional per-choice notes explaining why a distractor is wrong. */
  readonly whyWrong?: Readonly<Record<number, string>>;
}

/** Select all that apply. CompTIA asks these and they are worth practising. */
export interface MultiQuestion extends QuestionBase {
  readonly kind: 'multi';
  readonly choices: readonly string[];
  /** Indices into `choices`. Must be non-empty, unique and in range. */
  readonly answers: readonly number[];
}

/** Type the answer. Good for subnet masks, port numbers, command names. */
export interface InputQuestion extends QuestionBase {
  readonly kind: 'input';
  /** All spellings counted as correct. Compared case-insensitively, trimmed. */
  readonly accept: readonly string[];
  readonly placeholder?: string;
}

/** Put the steps in the right order. Built for troubleshooting methodology. */
export interface OrderQuestion extends QuestionBase {
  readonly kind: 'order';
  /** Authored in the correct order; the UI shuffles them for play. */
  readonly steps: readonly string[];
}

/** Pair each left item with its right item. Ports, OSI layers, cable types. */
export interface MatchQuestion extends QuestionBase {
  readonly kind: 'match';
  readonly pairs: readonly (readonly [left: string, right: string])[];
}

export type Question =
  | ChoiceQuestion
  | MultiQuestion
  | InputQuestion
  | OrderQuestion
  | MatchQuestion;

export type QuestionKind = Question['kind'];

// ---------------------------------------------------------------------------
// Topology diagrams
// ---------------------------------------------------------------------------

export type NodeKind =
  | 'router'
  | 'switch'
  | 'firewall'
  | 'server'
  | 'pc'
  | 'ap'
  | 'cloud'
  | 'controller'
  | 'sensor';

export interface TopologyNode {
  readonly id: string;
  readonly kind: NodeKind;
  readonly label: string;
  /** Second line under the label, typically an address. */
  readonly sublabel?: string;
  /** Grid column and row; the renderer maps these onto the SVG canvas. */
  readonly col: number;
  readonly row: number;
  /** Draws the node in a fault colour. Use for the symptom, not the cause. */
  readonly state?: 'ok' | 'warn' | 'down';
}

export interface TopologyLink {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly state?: 'ok' | 'warn' | 'down';
}

export interface Topology {
  readonly nodes: readonly TopologyNode[];
  readonly links: readonly TopologyLink[];
  readonly caption?: string;
}

// ---------------------------------------------------------------------------
// Answer handling
// ---------------------------------------------------------------------------

/** A player's response, shaped to match the question kind. */
export type Response =
  | { readonly kind: 'choice'; readonly index: number }
  | { readonly kind: 'multi'; readonly indices: readonly number[] }
  | { readonly kind: 'input'; readonly text: string }
  | { readonly kind: 'order'; readonly order: readonly number[] }
  | { readonly kind: 'match'; readonly mapping: Readonly<Record<number, number>> };

export interface Judgement {
  readonly correct: boolean;
  /** 0..1. Partial credit on multi/order/match feeds the scheduler a finer signal. */
  readonly credit: number;
  /** Indices the player got wrong, where the concept applies. */
  readonly wrongParts: readonly number[];
}
