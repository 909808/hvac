import type { BookRef, Question, Topology, Track } from './types';

export interface Issue {
  readonly level: 'error' | 'warning';
  /** Question id, track id or book id the issue belongs to. */
  readonly subject: string;
  readonly message: string;
}

export interface ValidationReport {
  readonly errors: readonly Issue[];
  readonly warnings: readonly Issue[];
  readonly ok: boolean;
}

interface ValidateInput {
  readonly tracks: readonly Track[];
  readonly books: readonly BookRef[];
  readonly questions: readonly Question[];
}

const MIN_EXPLAIN_LENGTH = 25;

/**
 * Structural checks over the whole content set.
 *
 * This cannot tell you a fact is true — only a book can do that. What it does
 * catch is every mechanical way a transcription goes wrong: an answer index off
 * by one, an objective code that does not exist, a duplicate id silently
 * shadowing an earlier question, a match table with an ambiguous mapping.
 *
 * Run by `npm test`, so a bad paste fails CI rather than teaching you nonsense.
 */
export function validateContent(input: ValidateInput): ValidationReport {
  const issues: Issue[] = [];
  const err = (subject: string, message: string) =>
    issues.push({ level: 'error', subject, message });
  const warn = (subject: string, message: string) =>
    issues.push({ level: 'warning', subject, message });

  const bookIds = new Set(input.books.map((b) => b.id));
  const bookById = new Map(input.books.map((b) => [b.id, b]));
  const trackById = new Map(input.tracks.map((t) => [t.id, t]));

  // --- tracks -------------------------------------------------------------
  for (const track of input.tracks) {
    const totalWeight = track.domains.reduce((sum, d) => sum + d.examWeight, 0);
    if (track.domains.length > 0 && Math.abs(totalWeight - 100) > 0.5) {
      warn(track.id, `domain exam weights sum to ${totalWeight}%, expected 100%`);
    }
    const seenDomains = new Set<string>();
    for (const domain of track.domains) {
      if (seenDomains.has(domain.id)) err(track.id, `duplicate domain id "${domain.id}"`);
      seenDomains.add(domain.id);

      const seenObjectives = new Set<string>();
      for (const objective of domain.objectives) {
        if (seenObjectives.has(objective.id)) {
          err(track.id, `duplicate objective id "${objective.id}"`);
        }
        seenObjectives.add(objective.id);

        // "1.4" must live under domain "1.0".
        const domainMajor = domain.id.split('.')[0];
        const objectiveMajor = objective.id.split('.')[0];
        if (domainMajor !== objectiveMajor) {
          err(track.id, `objective "${objective.id}" is filed under domain "${domain.id}"`);
        }
      }
    }
  }

  // --- books --------------------------------------------------------------
  const seenBooks = new Set<string>();
  for (const book of input.books) {
    if (seenBooks.has(book.id)) err(book.id, 'duplicate book id');
    seenBooks.add(book.id);
    if (!/^\d{13}$/.test(book.isbn13.replace(/-/g, ''))) {
      warn(book.id, `isbn13 "${book.isbn13}" is not 13 digits`);
    }
  }

  // --- questions ----------------------------------------------------------
  const seenIds = new Set<string>();

  for (const q of input.questions) {
    const at = q.id || '<question with no id>';

    if (!q.id.trim()) err(at, 'id is empty');
    if (seenIds.has(q.id)) err(at, 'duplicate question id — the later one would shadow the earlier');
    seenIds.add(q.id);

    if (!q.prompt.trim()) err(at, 'prompt is empty');
    if (q.explain.trim().length < MIN_EXPLAIN_LENGTH) {
      warn(at, `explanation is very short (${q.explain.trim().length} chars) — say why, not just what`);
    }

    // Track / domain / objective wiring.
    const track = trackById.get(q.track);
    if (!track) {
      err(at, `unknown track "${q.track}"`);
    } else {
      if (!q.id.startsWith(`${q.track}.`)) {
        warn(at, `id should start with "${q.track}." to keep ids sortable by track`);
      }
      const domain = track.domains.find((d) => d.id === q.domain);
      if (!domain) {
        err(at, `domain "${q.domain}" does not exist in track "${q.track}"`);
      } else if (!domain.objectives.some((o) => o.id === q.objective)) {
        err(at, `objective "${q.objective}" does not exist in domain "${q.domain}"`);
      }
    }

    // Citations.
    switch (q.source.kind) {
      case 'book': {
        if (!bookIds.has(q.source.book)) {
          err(at, `cites unknown book "${q.source.book}" — register it in src/content/books.ts`);
        } else {
          const book = bookById.get(q.source.book)!;
          const track = trackById.get(q.track);
          if (track && book.targets !== track.revision) {
            warn(
              at,
              `cites "${book.id}" which targets ${book.targets}, but this question is filed under ${track.revision}`,
            );
          }
        }
        if (!q.source.pages.trim()) err(at, 'book citation has no page reference');
        break;
      }
      case 'standard':
        if (!q.source.ref.trim()) err(at, 'standard citation has no reference');
        break;
      case 'uncited':
        if (q.status === 'verified') {
          err(at, 'marked verified but has no citation');
        }
        break;
      case 'generated':
        break;
    }

    // Kind-specific shape.
    switch (q.kind) {
      case 'choice': {
        checkChoiceList(q.choices, at, err);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
          err(at, `answer index ${q.answer} is out of range for ${q.choices.length} choices`);
        }
        for (const key of Object.keys(q.whyWrong ?? {})) {
          const idx = Number(key);
          if (!Number.isInteger(idx) || idx < 0 || idx >= q.choices.length) {
            err(at, `whyWrong key ${key} is out of range`);
          } else if (idx === q.answer) {
            err(at, `whyWrong explains index ${idx}, which is the correct answer`);
          }
        }
        break;
      }

      case 'multi': {
        checkChoiceList(q.choices, at, err);
        if (q.answers.length === 0) err(at, 'multi question has no correct answers');
        if (new Set(q.answers).size !== q.answers.length) err(at, 'answers contains duplicates');
        for (const idx of q.answers) {
          if (!Number.isInteger(idx) || idx < 0 || idx >= q.choices.length) {
            err(at, `answer index ${idx} is out of range for ${q.choices.length} choices`);
          }
        }
        if (q.answers.length === q.choices.length) {
          err(at, 'every choice is correct — the question cannot discriminate');
        }
        break;
      }

      case 'input': {
        if (q.accept.length === 0) err(at, 'input question accepts nothing');
        const normalised = q.accept.map(normaliseInput);
        if (normalised.some((s) => s.length === 0)) err(at, 'accept contains an empty string');
        if (new Set(normalised).size !== normalised.length) {
          warn(at, 'accept contains entries that are identical once normalised');
        }
        break;
      }

      case 'order': {
        if (q.steps.length < 3) err(at, 'order question needs at least 3 steps');
        if (new Set(q.steps).size !== q.steps.length) err(at, 'steps contains duplicates');
        if (q.steps.some((s) => !s.trim())) err(at, 'steps contains an empty string');
        break;
      }

      case 'match': {
        if (q.pairs.length < 2) err(at, 'match question needs at least 2 pairs');
        const lefts = q.pairs.map((p) => p[0]);
        const rights = q.pairs.map((p) => p[1]);
        if (new Set(lefts).size !== lefts.length) err(at, 'left-hand items must be unique');
        if (new Set(rights).size !== rights.length) {
          err(at, 'right-hand items must be unique, otherwise the mapping is ambiguous');
        }
        break;
      }
    }

    if (q.topology) checkTopology(q.topology, at, err);
  }

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  return { errors, warnings, ok: errors.length === 0 };
}

function checkChoiceList(
  choices: readonly string[],
  at: string,
  err: (subject: string, message: string) => void,
): void {
  if (choices.length < 2) err(at, 'needs at least 2 choices');
  if (choices.some((c) => !c.trim())) err(at, 'choices contains an empty string');
  const trimmed = choices.map((c) => c.trim().toLowerCase());
  if (new Set(trimmed).size !== trimmed.length) err(at, 'choices contains duplicates');
}

function checkTopology(
  topology: Topology,
  at: string,
  err: (subject: string, message: string) => void,
): void {
  const ids = new Set<string>();
  for (const node of topology.nodes) {
    if (ids.has(node.id)) err(at, `topology has duplicate node id "${node.id}"`);
    ids.add(node.id);
  }
  for (const link of topology.links) {
    if (!ids.has(link.from)) err(at, `topology link references unknown node "${link.from}"`);
    if (!ids.has(link.to)) err(at, `topology link references unknown node "${link.to}"`);
  }
}

/** Shared by the validator and the answer checker so both agree on equality. */
export function normaliseInput(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Human-readable report, used by the test suite and the in-app content audit. */
export function formatReport(report: ValidationReport): string {
  if (report.ok && report.warnings.length === 0) return 'Content OK: no errors, no warnings.';
  const lines: string[] = [];
  for (const issue of [...report.errors, ...report.warnings]) {
    lines.push(`${issue.level.toUpperCase()}  ${issue.subject}: ${issue.message}`);
  }
  lines.push('');
  lines.push(`${report.errors.length} error(s), ${report.warnings.length} warning(s).`);
  return lines.join('\n');
}
