import type { ContentStatus, Source, Topology, TrackId } from './types';

/**
 * Lessons — the teaching half of the app.
 *
 * A question bank tests what you already know. It is a poor way to learn
 * something new, because a wrong answer plus an explanation is a slow and
 * demoralising way to meet an idea for the first time.
 *
 * So each sector opens with a lesson: the concept explained, the numbers worth
 * memorising pulled out where you can find them, a worked example done step by
 * step, and the traps called out explicitly. Then the questions.
 *
 * Lessons are structured rather than free prose so the reader can render them
 * consistently and so a "key numbers" block is always findable in the same
 * place — which is what makes it usable as a reference later, not just a read.
 */

export interface Lesson {
  readonly id: string;
  readonly track: TrackId;
  /** Sector / domain this belongs to. */
  readonly domain: string;
  /** Position within the sector. */
  readonly order: number;
  readonly title: string;
  /** One line on why this matters — shown on the sector card. */
  readonly summary: string;
  /** Rough reading time in minutes, shown so a session can be planned. */
  readonly minutes: number;
  readonly sections: readonly LessonSection[];
  readonly source: Source;
  readonly status: ContentStatus;
}

export type LessonSection =
  | ProseSection
  | KeyNumbersSection
  | DiagramSection
  | WorkedSection
  | TableSection
  | CalloutSection;

/** Ordinary explanation. Blank lines become paragraphs. */
export interface ProseSection {
  readonly kind: 'prose';
  readonly heading?: string;
  readonly body: string;
}

/**
 * The numbers to commit to memory, in one findable block.
 *
 * Deliberately separate from prose: these are the things you will want to look
 * up on a roof at 4pm, and burying them in a paragraph makes that impossible.
 */
export interface KeyNumbersSection {
  readonly kind: 'keyNumbers';
  readonly heading: string;
  readonly items: readonly {
    readonly label: string;
    readonly value: string;
    readonly note?: string;
  }[];
}

export interface DiagramSection {
  readonly kind: 'diagram';
  readonly heading?: string;
  readonly topology: Topology;
  readonly caption?: string;
}

/**
 * A worked example, revealed a step at a time.
 *
 * Seeing the whole solution at once teaches much less than being made to
 * predict each step. The reader hides subsequent steps until you ask for them.
 */
export interface WorkedSection {
  readonly kind: 'worked';
  readonly heading: string;
  readonly problem: string;
  readonly steps: readonly {
    /** What you do at this step. */
    readonly action: string;
    /** What you get. */
    readonly result: string;
  }[];
  readonly answer: string;
  /** What the example was really teaching, beyond the arithmetic. */
  readonly moral?: string;
}

export interface TableSection {
  readonly kind: 'table';
  readonly heading: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly note?: string;
}

/**
 * A callout. `trap` is for the specific mistakes people make, `warning` for
 * anything that can hurt you or destroy equipment, `tip` for field shortcuts.
 */
export interface CalloutSection {
  readonly kind: 'callout';
  readonly tone: 'tip' | 'warning' | 'trap';
  readonly heading: string;
  readonly body: string;
}

/** Identity function that pins literal types, matching `defineQuestion`. */
export function defineLesson<const L extends Lesson>(lesson: L): L {
  return lesson;
}

export function lessonsFor(
  lessons: readonly Lesson[],
  track: string,
  domain: string,
): Lesson[] {
  return lessons
    .filter((l) => l.track === track && l.domain === domain)
    .sort((a, b) => a.order - b.order);
}

export function lessonMinutes(lessons: readonly Lesson[]): number {
  return lessons.reduce((sum, l) => sum + l.minutes, 0);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface LessonIssue {
  readonly level: 'error' | 'warning';
  readonly subject: string;
  readonly message: string;
}

/**
 * Structural checks, mirroring the question validator. Cannot tell you a lesson
 * is true — only that it is well formed and points at things that exist.
 */
export function validateLessons(
  lessons: readonly Lesson[],
  domainsByTrack: ReadonlyMap<string, ReadonlySet<string>>,
): LessonIssue[] {
  const issues: LessonIssue[] = [];
  const err = (subject: string, message: string) =>
    issues.push({ level: 'error', subject, message });
  const warn = (subject: string, message: string) =>
    issues.push({ level: 'warning', subject, message });

  const seen = new Set<string>();

  for (const lesson of lessons) {
    const at = lesson.id || '<lesson with no id>';

    if (!lesson.id.trim()) err(at, 'id is empty');
    if (seen.has(lesson.id)) err(at, 'duplicate lesson id');
    seen.add(lesson.id);

    if (!lesson.title.trim()) err(at, 'title is empty');
    if (!lesson.summary.trim()) err(at, 'summary is empty');
    if (lesson.minutes <= 0) err(at, 'minutes must be positive');

    const domains = domainsByTrack.get(lesson.track);
    if (!domains) err(at, `unknown track "${lesson.track}"`);
    else if (!domains.has(lesson.domain)) {
      err(at, `domain "${lesson.domain}" does not exist in track "${lesson.track}"`);
    }

    if (lesson.sections.length === 0) err(at, 'lesson has no sections');
    if (lesson.status === 'verified' && lesson.source.kind === 'uncited') {
      err(at, 'marked verified but has no citation');
    }

    let hasProse = false;
    for (const [index, section] of lesson.sections.entries()) {
      const where = `${at} section ${index + 1}`;

      switch (section.kind) {
        case 'prose':
          hasProse = true;
          if (!section.body.trim()) err(where, 'prose section is empty');
          break;

        case 'keyNumbers':
          if (section.items.length === 0) err(where, 'keyNumbers section has no items');
          for (const item of section.items) {
            if (!item.label.trim() || !item.value.trim()) {
              err(where, 'keyNumbers item is missing a label or value');
            }
          }
          break;

        case 'diagram': {
          const ids = new Set<string>();
          for (const node of section.topology.nodes) {
            if (ids.has(node.id)) err(where, `duplicate topology node "${node.id}"`);
            ids.add(node.id);
          }
          for (const link of section.topology.links) {
            if (!ids.has(link.from)) err(where, `link references unknown node "${link.from}"`);
            if (!ids.has(link.to)) err(where, `link references unknown node "${link.to}"`);
          }
          if (section.topology.nodes.length === 0) err(where, 'diagram has no nodes');
          break;
        }

        case 'worked':
          if (section.steps.length === 0) err(where, 'worked example has no steps');
          if (!section.answer.trim()) err(where, 'worked example has no answer');
          for (const step of section.steps) {
            if (!step.action.trim() || !step.result.trim()) {
              err(where, 'worked step is missing an action or result');
            }
          }
          break;

        case 'table': {
          if (section.columns.length === 0) err(where, 'table has no columns');
          if (section.rows.length === 0) err(where, 'table has no rows');
          for (const [rowIndex, row] of section.rows.entries()) {
            if (row.length !== section.columns.length) {
              err(
                where,
                `row ${rowIndex + 1} has ${row.length} cells for ${section.columns.length} columns`,
              );
            }
          }
          break;
        }

        case 'callout':
          if (!section.body.trim()) err(where, 'callout is empty');
          if (!section.heading.trim()) err(where, 'callout has no heading');
          break;
      }
    }

    if (!hasProse) warn(at, 'lesson has no prose section — it is all reference material');
  }

  return issues;
}
