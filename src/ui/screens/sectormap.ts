import { levelFor, type Profile } from '@engine/profile';
import { overallProgress, sectorProgress, unlockedLabs, type SectorProgress } from '@engine/progression';
import type { Question, Track } from '@engine/types';
import { contentStats } from '@content/index';
import { h } from '../dom';
import { labModesFor, type ModeId } from '../modes';

export interface SectorMapContext {
  readonly track: Track;
  readonly tracks: readonly Track[];
  readonly pool: readonly Question[];
  readonly profile: Profile;
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
 * The sector map — the HVAC track's home screen.
 *
 * A path rather than a menu. Each sector shows what it covers, whether it is
 * open, and what its checkpoint costs. Locked sectors stay visible and say what
 * is holding them, because hiding the road ahead makes a curriculum feel
 * arbitrary.
 */
export function renderSectorMap(ctx: SectorMapContext): HTMLElement {
  const progress = sectorProgress(ctx.track, ctx.profile, ctx.pool);
  const overall = overallProgress(ctx.track, ctx.profile, ctx.pool);
  const unlocked = unlockedLabs(ctx.track, ctx.profile, ctx.pool);
  const labs = labModesFor(unlocked, ctx.track.id);
  const level = levelFor(ctx.profile.xp);
  const forTrack = ctx.pool.filter((q) => q.track === ctx.track.id);
  const stats = contentStats(forTrack);

  const root = h('div', { class: 'home' });

  // --- masthead ------------------------------------------------------------
  root.appendChild(
    h(
      'header',
      { class: 'masthead' },
      h(
        'div',
        {},
        h('h1', { text: ctx.track.title }),
        h('p', { class: 'subtitle', text: ctx.track.subtitle }),
      ),
      h(
        'div',
        { class: 'masthead-meta' },
        h('span', {
          class: 'chip chip-rev',
          text: `${overall.passed} / ${overall.total} sectors`,
        }),
        h(
          'div',
          { class: 'level-box' },
          h('span', { class: 'level-num', text: `Level ${level.level}` }),
          h(
            'div',
            { class: 'level-track' },
            h('div', { class: 'level-fill', style: `width: ${(level.into / level.needed) * 100}%` }),
          ),
          h('span', { class: 'level-xp', text: `${level.into} / ${level.needed} XP` }),
        ),
      ),
    ),
  );

  // --- track switcher ------------------------------------------------------
  if (ctx.tracks.length > 1) {
    const tabs = h('nav', { class: 'track-tabs' });
    for (const track of ctx.tracks) {
      const count = ctx.pool.filter((q) => q.track === track.id).length;
      tabs.appendChild(
        h(
          'button',
          {
            class: `track-tab ${track.id === ctx.track.id ? 'track-tab-active' : ''}`,
            onClick: () => ctx.onSelectTrack(track.id),
          },
          h('span', { text: track.title }),
          h('span', { class: 'track-count', text: count === 0 ? 'empty' : `${count}` }),
        ),
      );
    }
    root.appendChild(tabs);
  }

  // --- labs ----------------------------------------------------------------
  if (labs.length > 0) {
    const labSection = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Labs & simulators' }),
      h('p', {
        class: 'panel-note',
        text: 'Unlocked by the sectors you have reached. Practise these any time.',
      }),
    );

    const grid = h('div', { class: 'lab-grid' });
    for (const lab of labs) {
      const best = ctx.profile.bests[lab.id] ?? 0;
      grid.appendChild(
        h(
          'button',
          {
            class: `lab-card ${lab.id === 'service-call' ? 'lab-card-feature' : ''}`,
            onClick: () => ctx.onStartLab(lab.id),
          },
          h(
            'div',
            { class: 'lab-head' },
            h('span', { class: 'lab-glyph', text: lab.glyph }),
            h(
              'div',
              {},
              h('span', { class: 'lab-name', text: lab.name }),
              h('span', { class: 'lab-tagline', text: lab.tagline }),
            ),
          ),
          h('p', { class: 'lab-detail', text: lab.detail }),
          h('span', {
            class: 'lab-best',
            text: best > 0 ? `Best ${best.toLocaleString()}` : 'Not played yet',
          }),
        ),
      );
    }
    labSection.appendChild(grid);

    labSection.appendChild(
      h(
        'div',
        { class: 'health-actions' },
        h('button', {
          class: 'btn btn-ghost',
          onClick: ctx.onStartMixed,
          text: 'Mixed calculation workout',
        }),
        h('button', { class: 'btn btn-ghost', onClick: ctx.onStartWeak, text: 'Weak spots' }),
      ),
    );

    root.appendChild(labSection);
  }

  // --- the path ------------------------------------------------------------
  const path = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'The path' }),
    h('p', {
      class: 'panel-note',
      text:
        'Each sector opens when the one before it is passed. The order is a dependency, not a ' +
        'ranking — superheat only makes sense once you have the cycle.',
    }),
  );

  const list = h('div', { class: 'sector-list' });
  for (const entry of progress) list.appendChild(renderSector(ctx, entry));
  path.appendChild(list);
  root.appendChild(path);

  // --- content health -------------------------------------------------------
  root.appendChild(
    h(
      'section',
      { class: 'panel content-health' },
      h('h2', { class: 'panel-title', text: 'Content health' }),
      h(
        'div',
        { class: 'health-row' },
        healthStat(String(stats.total), 'questions'),
        healthStat(String(stats.verified), 'verified'),
        healthStat(String(stats.draft), 'need a citation'),
        healthStat(String(stats.citedToStandard), 'cited to a standard'),
        healthStat(String(stats.citedToBook), 'cited to a book'),
      ),
      h('p', {
        class: 'health-note',
        text:
          stats.draft > 0
            ? `${stats.draft} item${stats.draft === 1 ? '' : 's'} are marked unverified — badged in ` +
              'play, and excluded from checkpoints until you cite them. The generated labs are ' +
              'computed rather than transcribed, so they carry no citation risk.'
            : 'Every item carries a citation.',
      }),
      h(
        'div',
        { class: 'health-actions' },
        h('button', { class: 'btn btn-ghost', onClick: ctx.onShowAudit, text: 'Content audit' }),
        h('button', { class: 'btn btn-ghost', onClick: ctx.onShowProgress, text: 'Progress' }),
      ),
    ),
  );

  return root;
}

function renderSector(ctx: SectorMapContext, entry: SectorProgress): HTMLElement {
  const { sector, status, questionCount, record } = entry;
  const locked = status === 'locked';

  const card = h('div', { class: `sector sector-${status}` });

  const head = h(
    'div',
    { class: 'sector-head' },
    h('span', { class: 'sector-order', text: String(sector.order) }),
    h('span', { class: 'sector-glyph', text: sector.glyph }),
    h(
      'div',
      { class: 'sector-titles' },
      h('span', { class: 'sector-title', text: sector.title }),
      h('span', { class: 'sector-blurb', text: sector.blurb }),
    ),
    h(
      'div',
      { class: 'sector-status' },
      status === 'passed'
        ? h('span', { class: 'sector-badge badge-passed', text: `✓ ${record?.bestPercent ?? 0}%` })
        : locked
          ? h('span', { class: 'sector-badge badge-locked', text: '🔒 locked' })
          : h('span', { class: 'sector-badge badge-open', text: 'open' }),
      h('span', { class: 'sector-count', text: `${questionCount} q` }),
    ),
  );
  card.appendChild(head);

  if (locked) {
    card.appendChild(
      h('p', { class: 'sector-locked-note', text: `Pass ${entry.lockedBy} to open this sector.` }),
    );
    return card;
  }

  const actions = h('div', { class: 'sector-actions' });

  actions.appendChild(
    h('button', {
      class: 'btn btn-ghost',
      disabled: questionCount === 0,
      onClick: () => ctx.onStartDrill(sector.id),
      text: 'Study',
    }),
  );

  actions.appendChild(
    h('button', {
      class: `btn ${status === 'passed' ? 'btn-ghost' : 'btn-primary'}`,
      disabled: questionCount === 0,
      onClick: () => ctx.onStartCheckpoint(sector.id),
      text: status === 'passed' ? 'Retake checkpoint' : 'Take checkpoint',
    }),
  );

  actions.appendChild(
    h('span', {
      class: 'hint',
      text:
        questionCount === 0
          ? 'No content in this sector yet'
          : `${sector.checkpoint.questions} questions · ${sector.checkpoint.passPercent}% to pass` +
            (record && !record.passed ? ` · best ${record.bestPercent}%` : ''),
    }),
  );

  card.appendChild(actions);
  return card;
}

function healthStat(value: string, label: string): HTMLElement {
  return h(
    'div',
    { class: 'health-stat' },
    h('span', { class: 'health-value', text: value }),
    h('span', { class: 'health-label', text: label }),
  );
}
