import { lessonMinutes, lessonsFor, type Lesson } from '@engine/lesson';
import type { Profile } from '@engine/profile';
import {
  currentSector,
  overallProgress,
  sectorProgress,
  unlockedLabs,
  type SectorProgress,
} from '@engine/progression';
import type { Question, Track } from '@engine/types';
import { h } from '../dom';
import { labModesFor, type ModeId } from '../modes';

export interface SectorMapContext {
  readonly track: Track;
  readonly tracks: readonly Track[];
  readonly pool: readonly Question[];
  readonly lessons: readonly Lesson[];
  readonly profile: Profile;
  /** Sector id the reader has opened, or undefined to default to the current one. */
  readonly expanded: string | undefined;
  onToggleSector(sectorId: string): void;
  onStartLesson(sectorId: string): void;
  onStartDrill(sectorId: string): void;
  onStartCheckpoint(sectorId: string): void;
  onStartLab(mode: ModeId): void;
  onStartMixed(): void;
  onStartWeak(): void;
  onSelectTrack(trackId: string): void;
  onShowProgress(): void;
  onShowAudit(): void;
}

/**
 * The path.
 *
 * Design intent: one screen, one obvious next thing, and everything else out of
 * the way until asked for. A study app that opens with seven cards and three
 * panels of statistics is asking you to make a decision before you have started,
 * and the easiest way to answer that is to close the tab.
 *
 * So: a Continue card for where you actually are, the sectors as a quiet list
 * with only the current one open, and the labs, progress and content tooling
 * folded into a footer.
 */
export function renderSectorMap(ctx: SectorMapContext): HTMLElement {
  const progress = sectorProgress(ctx.track, ctx.profile, ctx.pool);
  const overall = overallProgress(ctx.track, ctx.profile, ctx.pool);
  const current = currentSector(ctx.track, ctx.profile, ctx.pool);
  const openId = ctx.expanded ?? current?.sector.id;

  const root = h('div', { class: 'home' });

  // --- masthead ------------------------------------------------------------
  root.appendChild(
    h(
      'header',
      { class: 'masthead' },
      h('h1', { text: ctx.track.title }),
      h(
        'div',
        { class: 'masthead-progress' },
        h(
          'div',
          { class: 'thin-track', title: `${overall.passed} of ${overall.total} sectors passed` },
          h('div', {
            class: 'thin-fill',
            style: `width: ${overall.total === 0 ? 0 : (overall.passed / overall.total) * 100}%`,
          }),
        ),
        h('span', { class: 'masthead-count', text: `${overall.passed} / ${overall.total}` }),
      ),
    ),
  );

  if (ctx.track.archived) {
    root.appendChild(
      h('p', {
        class: 'archived-notice',
        text: 'This track is archived. It still works and your progress is kept.',
      }),
    );
  }

  // --- the one next thing --------------------------------------------------
  const forTrack = ctx.pool.filter((q) => q.track === ctx.track.id);
  if (forTrack.length === 0) {
    root.appendChild(
      h(
        'div',
        { class: 'empty-state' },
        h('h2', { text: 'Nothing here yet' }),
        h('p', {
          text: 'The engine works — this track just has no content. Add it under src/content/.',
        }),
      ),
    );
    return root;
  }

  if (current) {
    root.appendChild(renderContinue(ctx, current));
  }

  // --- the path ------------------------------------------------------------
  const list = h('ol', { class: 'path' });
  for (const entry of progress) {
    const lessons = lessonsFor(ctx.lessons, ctx.track.id, entry.sector.id);
    list.appendChild(renderSector(ctx, entry, lessons, entry.sector.id === openId));
  }
  root.appendChild(list);

  root.appendChild(renderFooter(ctx));
  return root;
}

// ---------------------------------------------------------------------------
// Continue
// ---------------------------------------------------------------------------

function renderContinue(ctx: SectorMapContext, current: SectorProgress): HTMLElement {
  const { sector } = current;
  const lessons = lessonsFor(ctx.lessons, ctx.track.id, sector.id);
  const record = current.record;

  // What to suggest depends on how far into the sector they are.
  const started = (record?.attempts ?? 0) > 0;
  const suggestion = !started && lessons.length > 0
    ? { label: 'Start the lesson', detail: `${lessonMinutes(lessons)} min read`, run: () => ctx.onStartLesson(sector.id) }
    : started
      ? { label: 'Practise', detail: `best ${record?.bestPercent ?? 0}% · ${sector.checkpoint.passPercent}% to pass`, run: () => ctx.onStartDrill(sector.id) }
      : { label: 'Practise', detail: `${current.questionCount} questions`, run: () => ctx.onStartDrill(sector.id) };

  return h(
    'section',
    { class: 'continue' },
    h(
      'div',
      { class: 'continue-body' },
      h('span', { class: 'continue-label', text: started ? 'Pick up where you left off' : 'Up next' }),
      h('h2', { class: 'continue-title', text: `${sector.order}. ${sector.title}` }),
      h('p', { class: 'continue-detail', text: suggestion.detail }),
    ),
    h('button', { class: 'btn btn-primary', onClick: suggestion.run, text: suggestion.label }),
  );
}

// ---------------------------------------------------------------------------
// Sector rows
// ---------------------------------------------------------------------------

function renderSector(
  ctx: SectorMapContext,
  entry: SectorProgress,
  lessons: readonly Lesson[],
  open: boolean,
): HTMLElement {
  const { sector, status, questionCount, record } = entry;
  const locked = status === 'locked';

  const row = h('li', { class: `sector sector-${status} ${open ? 'sector-open-row' : ''}` });

  // Locked rows keep their number so the path still reads as a sequence.
  const marker = status === 'passed' ? '✓' : String(sector.order);

  const header = h(
    'button',
    {
      class: 'sector-head',
      'aria-expanded': open ? 'true' : 'false',
      onClick: () => ctx.onToggleSector(sector.id),
    },
    h('span', { class: 'sector-marker', text: marker }),
    h('span', { class: 'sector-title', text: sector.title }),
    status === 'passed'
      ? h('span', { class: 'sector-meta', text: `${record?.bestPercent ?? 0}%` })
      : locked
        ? h('span', { class: 'sector-meta sector-locked-icon', text: 'locked' })
        : h('span', { class: 'sector-meta', text: `${questionCount}` }),
  );
  row.appendChild(header);

  if (!open) return row;

  const detail = h('div', { class: 'sector-detail' });
  detail.appendChild(h('p', { class: 'sector-blurb', text: sector.blurb }));

  if (locked) {
    detail.appendChild(
      h('p', { class: 'sector-locked-note', text: `Opens when you pass ${entry.lockedBy}.` }),
    );
    row.appendChild(detail);
    return row;
  }

  const actions = h('div', { class: 'sector-actions' });

  if (lessons.length > 0) {
    actions.appendChild(
      h('button', {
        class: `btn ${status === 'passed' ? 'btn-quiet' : 'btn-primary'}`,
        onClick: () => ctx.onStartLesson(sector.id),
        text: `Learn · ${lessonMinutes(lessons)} min`,
      }),
    );
  }

  actions.appendChild(
    h('button', {
      class: 'btn btn-quiet',
      disabled: questionCount === 0,
      onClick: () => ctx.onStartDrill(sector.id),
      text: 'Practise',
    }),
  );

  actions.appendChild(
    h('button', {
      class: 'btn btn-quiet',
      disabled: questionCount === 0,
      onClick: () => ctx.onStartCheckpoint(sector.id),
      text: status === 'passed' ? 'Retake' : 'Checkpoint',
    }),
  );

  detail.appendChild(actions);
  detail.appendChild(
    h('p', {
      class: 'sector-foot',
      text:
        questionCount === 0
          ? 'No questions in this sector yet'
          : `${sector.checkpoint.questions}-question checkpoint · ${sector.checkpoint.passPercent}% to pass` +
            (record && !record.passed ? ` · best so far ${record.bestPercent}%` : ''),
    }),
  );

  row.appendChild(detail);
  return row;
}

// ---------------------------------------------------------------------------
// Footer — everything that is not the path
// ---------------------------------------------------------------------------

function renderFooter(ctx: SectorMapContext): HTMLElement {
  const unlocked = unlockedLabs(ctx.track, ctx.profile, ctx.pool);
  const labs = labModesFor(unlocked, ctx.track.id);
  const footer = h('footer', { class: 'shelf' });

  if (labs.length > 0) {
    const details = h('details', { class: 'shelf-group' });
    details.appendChild(h('summary', { text: `Labs & practice (${labs.length})` }));

    const list = h('div', { class: 'shelf-list' });
    for (const lab of labs) {
      list.appendChild(
        h(
          'button',
          { class: 'shelf-item', onClick: () => ctx.onStartLab(lab.id) },
          h('span', { class: 'shelf-item-name', text: lab.name }),
          h('span', { class: 'shelf-item-note', text: lab.tagline }),
        ),
      );
    }
    list.appendChild(
      h(
        'button',
        { class: 'shelf-item', onClick: ctx.onStartMixed },
        h('span', { class: 'shelf-item-name', text: 'Mixed calculations' }),
        h('span', { class: 'shelf-item-note', text: 'Everything numerical, shuffled' }),
      ),
    );
    list.appendChild(
      h(
        'button',
        { class: 'shelf-item', onClick: ctx.onStartWeak },
        h('span', { class: 'shelf-item-name', text: 'Weak spots' }),
        h('span', { class: 'shelf-item-note', text: 'Only what you keep missing' }),
      ),
    );

    details.appendChild(list);
    footer.appendChild(details);
  }

  const others = ctx.tracks.filter((t) => t.id !== ctx.track.id);
  const links = h(
    'div',
    { class: 'shelf-links' },
    h('button', { class: 'link', onClick: ctx.onShowProgress, text: 'Progress' }),
    h('button', { class: 'link', onClick: ctx.onShowAudit, text: 'Content' }),
    ...others.map((track) =>
      h('button', {
        class: 'link link-faint',
        onClick: () => ctx.onSelectTrack(track.id),
        text: track.archived ? `${track.title} (archived)` : track.title,
      }),
    ),
  );
  footer.appendChild(links);

  return footer;
}
