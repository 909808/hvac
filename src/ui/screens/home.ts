import { levelFor, objectiveProgress, type Profile } from '@engine/profile';
import type { Question, Track } from '@engine/types';
import { contentStats } from '@content/index';
import { h } from '../dom';
import { MODES, unavailableReason, type ModeId } from '../modes';

export interface HomeContext {
  readonly track: Track;
  readonly tracks: readonly Track[];
  readonly pool: readonly Question[];
  readonly profile: Profile;
  onStart(mode: ModeId, domain?: string): void;
  onSelectTrack(trackId: string): void;
  onShowProgress(): void;
  onShowAudit(): void;
}

export function renderHome(ctx: HomeContext): HTMLElement {
  const forTrack = ctx.pool.filter((q) => q.track === ctx.track.id);
  const stats = contentStats(forTrack);
  const level = levelFor(ctx.profile.xp);

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
        h('span', { class: 'chip chip-rev', text: ctx.track.revision }),
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
    if (ctx.track.archived) {
      root.appendChild(
        h(
          'div',
          { class: 'panel archived-notice' },
          h('strong', { text: 'This track is archived.' }),
          h('span', {
            text: ' It still works and your progress is kept, but it is no longer the focus.',
          }),
        ),
      );
    }

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

  // --- empty track ---------------------------------------------------------
  if (forTrack.length === 0) {
    root.appendChild(
      h(
        'div',
        { class: 'panel empty-state' },
        h('h2', { text: 'No content in this track yet' }),
        h('p', {
          text:
            'The engine, scoring and scheduling all work already — this track just has no questions. ' +
            'Add them under src/content/ and they appear here. See CONTENT_GUIDE.md for the shape.',
        }),
      ),
    );
    return root;
  }

  // --- modes ---------------------------------------------------------------
  const grid = h('div', { class: 'mode-grid' });
  for (const mode of MODES) {
    const blocked = unavailableReason(mode, ctx.track, ctx.pool, ctx.profile);
    const best = ctx.profile.bests[mode.id] ?? 0;

    grid.appendChild(
      h(
        'button',
        {
          class: `mode-card ${blocked ? 'mode-card-blocked' : ''}`,
          disabled: Boolean(blocked),
          onClick: () => ctx.onStart(mode.id),
        },
        h(
          'div',
          { class: 'mode-head' },
          h('span', { class: 'mode-glyph', text: mode.glyph }),
          h(
            'div',
            {},
            h('span', { class: 'mode-name', text: mode.name }),
            h('span', { class: 'mode-tagline', text: mode.tagline }),
          ),
        ),
        h('p', { class: 'mode-detail', text: mode.detail }),
        h(
          'div',
          { class: 'mode-foot' },
          blocked
            ? h('span', { class: 'mode-blocked', text: blocked })
            : best > 0
              ? h('span', { class: 'mode-best', text: `Best ${best.toLocaleString()}` })
              : h('span', { class: 'mode-best', text: 'Not played yet' }),
        ),
      ),
    );
  }
  root.appendChild(grid);

  // --- domain quick-start --------------------------------------------------
  const domainPanel = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'Drill one domain' }),
  );
  const progress = objectiveProgress(ctx.profile, forTrack);
  const progressByObjective = new Map(progress.map((p) => [p.objective, p]));

  const domainList = h('div', { class: 'domain-list' });
  for (const domain of ctx.track.domains) {
    const questions = forTrack.filter((q) => q.domain === domain.id);
    if (questions.length === 0) continue;

    const objectives = domain.objectives
      .map((o) => progressByObjective.get(o.id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
    const totalMastery =
      objectives.length === 0
        ? 0
        : objectives.reduce((sum, o) => sum + o.mastery, 0) / objectives.length;

    domainList.appendChild(
      h(
        'button',
        {
          class: 'domain-row',
          onClick: () => ctx.onStart('drill', domain.id),
        },
        h('span', { class: 'domain-id', text: domain.id }),
        h(
          'span',
          { class: 'domain-body' },
          h('span', { class: 'domain-title', text: domain.title }),
          h(
            'span',
            { class: 'domain-track' },
            h('span', { class: 'domain-fill', style: `width: ${totalMastery * 100}%` }),
          ),
        ),
        h('span', { class: 'domain-weight', text: `${domain.examWeight}%` }),
        h('span', { class: 'domain-count', text: `${questions.length} q` }),
      ),
    );
  }
  domainPanel.appendChild(domainList);
  root.appendChild(domainPanel);

  // --- content health ------------------------------------------------------
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
            ? `${stats.draft} item${stats.draft === 1 ? '' : 's'} are marked unverified — they appear in ` +
              'practice with a badge, and are excluded from exam simulation until you cite them.'
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

function healthStat(value: string, label: string): HTMLElement {
  return h(
    'div',
    { class: 'health-stat' },
    h('span', { class: 'health-value', text: value }),
    h('span', { class: 'health-label', text: label }),
  );
}
