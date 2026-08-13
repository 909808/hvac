import { dailyOverhead, jobReadiness, specialisms } from '@career/career';
import { jobMinutes } from '@career/jobs';
import type { CareerState, DistrictId, Job } from '@career/types';
import { MINUTES_PER_DAY } from '@career/types';
import { district, rank, rankProgress } from '@career/world';
import { h } from '../dom';
import { renderTownMap } from '../townmap';

export interface CareerContext {
  readonly state: CareerState;
  readonly passedSectors: ReadonlySet<string>;
  readonly sectorTitles: ReadonlyMap<string, string>;
  readonly selectedDistrict: DistrictId | undefined;
  onSelectDistrict(id: DistrictId | undefined): void;
  onStartJob(job: Job): void;
  onOpenVan(): void;
  onOpenLog(): void;
  onEndDay(): void;
  onStudy(sectorId?: string): void;
  onBegin(): void;
}

/**
 * The working day.
 *
 * One screen: where you are, what work is going, and what is stopping you from
 * taking the rest of it. The blockers are the important part — a job you cannot
 * take says *why* ("Study Refrigerants & EPA 608", "Buy a manometer") and the
 * reason is a button that takes you there. That is the entire loop, and it is
 * why there is no XP anywhere: the reward for learning something is that a job
 * you could see but not touch becomes one you can.
 */
export function renderCareer(ctx: CareerContext): HTMLElement {
  const { state } = ctx;
  const root = h('div', { class: 'career' });

  if (!state.started) return renderIntro(ctx);

  root.appendChild(renderStatus(ctx));
  root.appendChild(renderMap(ctx));
  root.appendChild(renderBoard(ctx));
  root.appendChild(renderFooter(ctx));
  return root;
}

// ---------------------------------------------------------------------------
// First run
// ---------------------------------------------------------------------------

function renderIntro(ctx: CareerContext): HTMLElement {
  return h(
    'div',
    { class: 'career career-intro' },
    h(
      'section',
      { class: 'panel intro-card' },
      h('span', { class: 'intro-label', text: 'The side of it that pays' }),
      h('h1', { class: 'intro-title', text: 'Start a career' }),
      h('p', {
        class: 'intro-body',
        text:
          'You are enrolled at the trade school with a bag of hand tools and two hundred and ' +
          'fifty dollars. Work comes in from six districts across town, and every job wants ' +
          'something you have not got yet — a certification, an instrument, a reputation.',
      }),
      h('p', {
        class: 'intro-body',
        text:
          'There are no experience points. What you earn is money, standing and rank, and the ' +
          'only thing that unlocks the interesting work is knowing how to do it. The lessons ' +
          'are the tech tree.',
      }),
      h('button', { class: 'btn btn-primary', onClick: ctx.onBegin, text: 'First day' }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

function renderStatus(ctx: CareerContext): HTMLElement {
  const { state } = ctx;
  const held = rank(state.rank);
  const progress = rankProgress(state.rank, ctx.passedSectors, state.jobsCompleted, state.earned);
  const used = MINUTES_PER_DAY - state.minutesLeft;

  const head = h(
    'header',
    { class: 'career-head' },
    h(
      'div',
      { class: 'career-head-top' },
      h(
        'div',
        { class: 'career-identity' },
        h('h1', { text: held.title }),
        h('span', { class: 'career-day', text: `Day ${state.day}` }),
      ),
      h(
        'div',
        { class: 'career-purse' },
        stat('Cash', `$${state.money.toLocaleString()}`),
        stat('Standing', String(state.reputation)),
        stat('Left today', formatMinutes(state.minutesLeft)),
      ),
    ),
    h(
      'div',
      { class: 'day-track', title: `${used} of ${MINUTES_PER_DAY} minutes used` },
      h('div', { class: 'day-fill', style: `width: ${(used / MINUTES_PER_DAY) * 100}%` }),
    ),
  );

  // What the next rank actually wants, stated as things to go and do.
  if (progress.next) {
    const wants: string[] = [];
    if (progress.sectorsMissing.length > 0) {
      // Naming every outstanding sector turns a one-line goal into a paragraph.
      const named = progress.sectorsMissing.slice(0, 2).map((s) => ctx.sectorTitles.get(s) ?? s);
      const rest = progress.sectorsMissing.length - named.length;
      wants.push(`pass ${named.join(', ')}${rest > 0 ? ` and ${rest} more` : ''}`);
    }
    if (progress.jobsShort > 0) wants.push(`${progress.jobsShort} more jobs`);
    if (progress.earnedShort > 0) wants.push(`$${progress.earnedShort.toLocaleString()} more earned`);

    head.appendChild(
      h('p', {
        class: 'career-next',
        text: progress.ready
          ? `Ready for ${progress.next.title} — finish a job to make it official.`
          : `${progress.next.title}: ${wants.join(' · ')}`,
      }),
    );
  }

  return head;
}

function stat(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'purse-stat' },
    h('span', { class: 'purse-label', text: label }),
    h('span', { class: 'purse-value', text: value }),
  );
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

function renderMap(ctx: CareerContext): HTMLElement {
  const { state } = ctx;

  const counts = new Map<DistrictId, number>();
  const actionable = new Set<DistrictId>();
  for (const job of state.board) {
    counts.set(job.district, (counts.get(job.district) ?? 0) + 1);
    if (jobReadiness(state, job, ctx.passedSectors, ctx.sectorTitles).ready) {
      actionable.add(job.district);
    }
  }

  const section = h('section', { class: 'panel map-panel' });
  section.appendChild(
    renderTownMap({
      state,
      jobCounts: counts,
      actionable,
      selected: ctx.selectedDistrict,
      onSelect: ctx.onSelectDistrict,
    }),
  );

  if (ctx.selectedDistrict) {
    const d = district(ctx.selectedDistrict);
    section.appendChild(
      h(
        'div',
        { class: 'map-note' },
        h('strong', { text: d.name }),
        h('span', { text: d.blurb }),
        h('span', { class: 'map-travel', text: `${d.travelMinutes} min each way` }),
      ),
    );
  } else {
    section.appendChild(
      h('p', {
        class: 'map-note map-note-idle',
        text: 'Tap a district to filter the board. Filled markers have work you can take today.',
      }),
    );
  }

  return section;
}

// ---------------------------------------------------------------------------
// Job board
// ---------------------------------------------------------------------------

function renderBoard(ctx: CareerContext): HTMLElement {
  const { state } = ctx;
  const filtered = ctx.selectedDistrict
    ? state.board.filter((j) => j.district === ctx.selectedDistrict)
    : state.board;

  const section = h('section', { class: 'panel board' });
  section.appendChild(h('h2', { class: 'panel-title', text: 'Work going' }));

  if (filtered.length === 0) {
    section.appendChild(
      h('p', {
        class: 'panel-note',
        text: ctx.selectedDistrict
          ? 'Nothing on the board there today.'
          : 'The board is clear. Call it a day.',
      }),
    );
    return section;
  }

  const ready: { job: Job; blockers: readonly string[] }[] = [];
  const blocked: { job: Job; blockers: readonly string[] }[] = [];

  for (const job of filtered) {
    const readiness = jobReadiness(state, job, ctx.passedSectors, ctx.sectorTitles);
    (readiness.ready ? ready : blocked).push({ job, blockers: readiness.blockers });
  }

  for (const entry of ready) {
    section.appendChild(renderJob(ctx, entry.job, []));
  }

  if (blocked.length > 0) {
    section.appendChild(
      h('h3', { class: 'board-divider', text: `Not yet (${blocked.length})` }),
    );
    for (const entry of blocked) {
      section.appendChild(renderJob(ctx, entry.job, entry.blockers));
    }
  }

  return section;
}

const RESOLUTION_LABEL: Record<Job['template']['resolution'], string> = {
  diagnose: 'Diagnostic call',
  knowledge: 'Talk it through',
  routine: 'Routine work',
};

function renderJob(ctx: CareerContext, job: Job, blockers: readonly string[]): HTMLElement {
  const t = job.template;
  const takeHome = Math.round(job.pay * rank(ctx.state.rank).cut);
  const open = blockers.length === 0;

  const card = h('article', { class: `job ${open ? '' : 'job-blocked'}` });

  card.appendChild(
    h(
      'div',
      { class: 'job-head' },
      h(
        'div',
        { class: 'job-headings' },
        h('h3', { class: 'job-title', text: t.title }),
        h('p', {
          class: 'job-where',
          text: `${job.client} · ${district(job.district).name} · ${jobMinutes(job)} min`,
        }),
      ),
      h(
        'div',
        { class: 'job-pay' },
        h('span', { class: 'job-pay-value', text: `$${takeHome}` }),
        takeHome === job.pay
          ? null
          : h('span', { class: 'job-pay-note', text: `of $${job.pay}` }),
      ),
    ),
  );

  card.appendChild(h('p', { class: 'job-complaint', text: `“${t.complaint}”` }));
  card.appendChild(
    h(
      'div',
      { class: 'job-tags' },
      h('span', { class: 'chip chip-quiet', text: RESOLUTION_LABEL[t.resolution] }),
      h('span', { class: 'chip chip-quiet', text: t.sector.replace('-', ' ') }),
    ),
  );

  if (open) {
    card.appendChild(
      h('button', { class: 'btn btn-primary', onClick: () => ctx.onStartJob(job), text: 'Take it' }),
    );
    return card;
  }

  // Blockers are the interesting half of the board. Each one that is a sector
  // gets a button straight to it, so "I cannot do this yet" and "here is how"
  // are the same click.
  const list = h('div', { class: 'job-blockers' });
  for (const blocker of blockers) {
    list.appendChild(h('span', { class: 'blocker', text: blocker }));
  }

  const missingSectors = t.requiresSectors.filter((s) => !ctx.passedSectors.has(s));
  if (missingSectors.length > 0) {
    const first = missingSectors[0]!;
    list.appendChild(
      h('button', {
        class: 'link',
        onClick: () => ctx.onStudy(first),
        text: `Open ${ctx.sectorTitles.get(first) ?? first} →`,
      }),
    );
  } else if (blockers.some((b) => b.startsWith('Buy'))) {
    list.appendChild(h('button', { class: 'link', onClick: ctx.onOpenVan, text: 'Open the van →' }));
  }

  card.appendChild(list);
  return card;
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function renderFooter(ctx: CareerContext): HTMLElement {
  const { state } = ctx;
  const overhead = dailyOverhead(state.rank);
  const focus = specialisms(state).slice(0, 3);

  const footer = h('footer', { class: 'shelf' });

  footer.appendChild(
    h(
      'div',
      { class: 'shelf-list' },
      h(
        'button',
        { class: 'shelf-item', onClick: ctx.onOpenVan },
        h('span', { class: 'shelf-item-name', text: 'The van' }),
        h('span', {
          class: 'shelf-item-note',
          text: `${state.tools.length} tool${state.tools.length === 1 ? '' : 's'}`,
        }),
      ),
      h(
        'button',
        { class: 'shelf-item', onClick: ctx.onOpenLog },
        h('span', { class: 'shelf-item-name', text: 'Logbook' }),
        h('span', {
          class: 'shelf-item-note',
          text: `${state.jobsCompleted} done · $${state.earned.toLocaleString()} earned`,
        }),
      ),
      h(
        'button',
        { class: 'shelf-item', onClick: ctx.onEndDay },
        h('span', { class: 'shelf-item-name', text: 'Call it a day' }),
        h('span', {
          class: 'shelf-item-note',
          text: overhead > 0 ? `Fresh board · $${overhead} costs` : 'Fresh board tomorrow',
        }),
      ),
    ),
  );

  if (focus.length > 0) {
    footer.appendChild(
      h(
        'p',
        { class: 'shelf-note' },
        h('span', { text: 'Known for ' }),
        h('span', {
          class: 'shelf-note-sectors',
          text: focus.map((f) => `${f.sector.replace('-', ' ')} (${f.reputation})`).join(', '),
        }),
      ),
    );
  }

  return footer;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
