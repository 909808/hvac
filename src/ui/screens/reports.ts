import { levelFor, objectiveProgress, type Profile } from '@engine/profile';
import type { Question, Track } from '@engine/types';
import { auditContent, objectiveTitle } from '@content/index';
import { h } from '../dom';

export interface ReportContext {
  readonly track: Track;
  readonly pool: readonly Question[];
  readonly profile: Profile;
  onHome(): void;
  onReset(): void;
}

export function renderProgress(ctx: ReportContext): HTMLElement {
  const forTrack = ctx.pool.filter((q) => q.track === ctx.track.id);
  const progress = objectiveProgress(ctx.profile, forTrack);
  const level = levelFor(ctx.profile.xp);
  const runs = ctx.profile.runs.slice(0, 12);

  const root = h('div', { class: 'report' });

  root.appendChild(
    h(
      'header',
      { class: 'report-head' },
      h('button', { class: 'btn btn-ghost', onClick: ctx.onHome, text: '← Menu' }),
      h('h1', { text: 'Progress' }),
    ),
  );

  root.appendChild(
    h(
      'section',
      { class: 'panel' },
      h(
        'div',
        { class: 'health-row' },
        stat(String(level.level), 'level'),
        stat(ctx.profile.xp.toLocaleString(), 'total XP'),
        stat(String(ctx.profile.bestStreak), 'best streak'),
        stat(String(ctx.profile.runs.length), 'runs'),
        stat(String(Object.keys(ctx.profile.cards).length), 'cards seen'),
      ),
    ),
  );

  const mastery = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'Mastery by objective' }),
    h('p', {
      class: 'panel-note',
      text:
        'Mastery blends accuracy with how far a card has travelled through the review schedule, so a single ' +
        'lucky answer does not read as mastered.',
    }),
  );

  const rows = h('div', { class: 'breakdown' });
  for (const item of progress) {
    rows.appendChild(
      h(
        'div',
        { class: 'breakdown-row' },
        h(
          'span',
          { class: 'breakdown-key', title: objectiveTitle(ctx.track, item.objective) },
          `${item.objective} `,
          h('span', { class: 'breakdown-sub', text: objectiveTitle(ctx.track, item.objective) }),
        ),
        h(
          'span',
          { class: 'breakdown-track' },
          h('span', {
            class: `breakdown-fill ${item.mastery < 0.4 ? 'breakdown-weak' : ''}`,
            style: `width: ${item.mastery * 100}%`,
          }),
        ),
        h('span', { class: 'breakdown-num', text: `${item.seen}/${item.total}` }),
      ),
    );
  }
  mastery.appendChild(rows);
  root.appendChild(mastery);

  if (runs.length > 0) {
    const history = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Recent runs' }),
    );
    const list = h('div', { class: 'run-list' });
    for (const run of runs) {
      list.appendChild(
        h(
          'div',
          { class: 'run-row' },
          h('span', { class: 'run-mode', text: run.mode }),
          h('span', {
            class: 'run-score',
            text: run.percent === undefined ? `${run.score.toLocaleString()} pts` : `${run.percent}%`,
          }),
          h('span', { class: 'run-detail', text: `${run.correct}/${run.asked}` }),
          h('span', { class: 'run-when', text: new Date(run.at).toLocaleString() }),
        ),
      );
    }
    history.appendChild(list);
    root.appendChild(history);
  }

  root.appendChild(
    h(
      'section',
      { class: 'panel danger-zone' },
      h('h2', { class: 'panel-title', text: 'Reset' }),
      h('p', {
        class: 'panel-note',
        text: 'Clears all scheduling history, XP and run records from this browser. Content is untouched.',
      }),
      h('button', { class: 'btn btn-danger', onClick: ctx.onReset, text: 'Reset my progress' }),
    ),
  );

  return root;
}

/**
 * Content audit. The same validation the test suite runs, surfaced in the app so
 * you can see the state of the bank without leaving what you are doing.
 */
export function renderAudit(ctx: ReportContext): HTMLElement {
  const report = auditContent();
  const drafts = ctx.pool.filter((q) => q.status === 'draft');

  const root = h('div', { class: 'report' });

  root.appendChild(
    h(
      'header',
      { class: 'report-head' },
      h('button', { class: 'btn btn-ghost', onClick: ctx.onHome, text: '← Menu' }),
      h('h1', { text: 'Content audit' }),
    ),
  );

  root.appendChild(
    h(
      'section',
      { class: `panel audit-summary ${report.ok ? 'audit-ok' : 'audit-bad'}` },
      h('h2', {
        class: 'panel-title',
        text: report.ok ? 'Structure is sound' : `${report.errors.length} error(s) found`,
      }),
      h('p', {
        class: 'panel-note',
        text: report.ok
          ? 'No broken references, duplicate ids, out-of-range answers or ambiguous mappings. This says ' +
            'nothing about whether the facts are right — only a book can tell you that.'
          : 'These are structural faults. Fix them in src/content/ and re-run npm test.',
      }),
    ),
  );

  if (report.errors.length > 0 || report.warnings.length > 0) {
    const issues = h('section', { class: 'panel' }, h('h2', { class: 'panel-title', text: 'Issues' }));
    const list = h('div', { class: 'issue-list' });
    for (const issue of [...report.errors, ...report.warnings]) {
      list.appendChild(
        h(
          'div',
          { class: `issue issue-${issue.level}` },
          h('span', { class: 'issue-level', text: issue.level }),
          h('span', { class: 'issue-subject', text: issue.subject }),
          h('span', { class: 'issue-message', text: issue.message }),
        ),
      );
    }
    issues.appendChild(list);
    root.appendChild(issues);
  }

  const draftPanel = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: `Awaiting a citation — ${drafts.length}` }),
    h('p', {
      class: 'panel-note',
      text:
        'These appear in practice modes with an "unverified" badge and are excluded from exam simulation. ' +
        'Check each against a book, correct it if needed, then swap cite.todo(...) for cite.book(...) and ' +
        "set status to 'verified'.",
    }),
  );

  if (drafts.length === 0) {
    draftPanel.appendChild(h('p', { class: 'panel-note', text: 'Nothing outstanding.' }));
  } else {
    const list = h('div', { class: 'issue-list' });
    for (const q of drafts) {
      list.appendChild(
        h(
          'div',
          { class: 'issue issue-draft' },
          h('span', { class: 'issue-subject', text: q.id }),
          h('span', {
            class: 'issue-message',
            text: q.source.kind === 'uncited' ? q.source.note : 'Marked draft',
          }),
        ),
      );
    }
    draftPanel.appendChild(list);
  }
  root.appendChild(draftPanel);

  return root;
}

function stat(value: string, label: string): HTMLElement {
  return h(
    'div',
    { class: 'health-stat' },
    h('span', { class: 'health-value', text: value }),
    h('span', { class: 'health-label', text: label }),
  );
}
