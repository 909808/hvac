import type { DaySummary } from '@career/career';
import { shopList, tool, TOOLS } from '@career/tools';
import type { CareerEvent, CareerState, ToolId } from '@career/types';
import { rank, RANKS, rankIndex } from '@career/world';
import { h } from '../dom';

export interface VanContext {
  readonly state: CareerState;
  readonly sectorTitles: ReadonlyMap<string, string>;
  readonly passedSectors: ReadonlySet<string>;
  /** Set after a failed purchase, cleared on the next render. */
  readonly notice: string | undefined;
  onBuy(id: ToolId): void;
  onBack(): void;
}

/**
 * The van.
 *
 * A shop where every item is a capability rather than a stat. The blurb says
 * what the instrument tells you, and owned tools list the readings they unlock
 * on a service call — because the honest reason to want a manometer is that
 * without one you cannot see static pressure, not that it is +5 to something.
 */
export function renderVan(ctx: VanContext): HTMLElement {
  const { state } = ctx;
  const owned = new Set(state.tools);
  const forSale = shopList(state.tools);

  const root = h('div', { class: 'career' });

  root.appendChild(
    h(
      'header',
      { class: 'career-head' },
      h(
        'div',
        { class: 'career-head-top' },
        h(
          'div',
          { class: 'career-identity' },
          h('h1', { text: 'The van' }),
          h('span', { class: 'career-day', text: `$${state.money.toLocaleString()} in hand` }),
        ),
        h('button', { class: 'btn btn-ghost', onClick: ctx.onBack, text: 'Back' }),
      ),
    ),
  );

  if (ctx.notice) {
    root.appendChild(h('p', { class: 'career-notice', text: ctx.notice }));
  }

  // --- what you own ---------------------------------------------------------
  const kit = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: `In the van (${state.tools.length})` }),
  );
  const kitList = h('div', { class: 'tool-list' });
  for (const item of TOOLS.filter((t) => owned.has(t.id))) {
    kitList.appendChild(
      h(
        'div',
        { class: 'tool tool-owned' },
        h(
          'div',
          { class: 'tool-head' },
          h('span', { class: 'tool-name', text: item.name }),
          h('span', { class: 'tool-owned-mark', text: '✓' }),
        ),
        h('p', { class: 'tool-blurb', text: item.blurb }),
        item.enables.length > 0
          ? h('p', {
              class: 'tool-enables',
              text: `Unlocks ${item.enables.length} reading${item.enables.length === 1 ? '' : 's'} on a call`,
            })
          : null,
      ),
    );
  }
  kit.appendChild(kitList);
  root.appendChild(kit);

  // --- what you do not ------------------------------------------------------
  if (forSale.length > 0) {
    const shop = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Supply house' }),
      h('p', {
        class: 'panel-note',
        text: 'Cheapest first. Nothing here is decorative — every one of them opens work you cannot currently take.',
      }),
    );

    const list = h('div', { class: 'tool-list' });
    for (const item of forSale) {
      const affordable = state.money >= item.cost;
      const taughtIn = item.taughtIn ? ctx.sectorTitles.get(item.taughtIn) : undefined;
      const studied = !item.taughtIn || ctx.passedSectors.has(item.taughtIn);

      list.appendChild(
        h(
          'div',
          { class: `tool ${affordable ? '' : 'tool-dear'}` },
          h(
            'div',
            { class: 'tool-head' },
            h('span', { class: 'tool-name', text: item.name }),
            h('span', { class: 'tool-cost', text: `$${item.cost}` }),
          ),
          h('p', { class: 'tool-blurb', text: item.blurb }),
          shopNote(item.enables.length, taughtIn, studied),
          h('button', {
            class: `btn ${affordable ? 'btn-quiet' : 'btn-ghost'}`,
            disabled: !affordable,
            onClick: () => ctx.onBuy(item.id),
            text: affordable ? 'Buy' : `Short $${item.cost - state.money}`,
          }),
        ),
      );
    }
    shop.appendChild(list);
    root.appendChild(shop);
  }

  return root;
}

/**
 * The one line under a shop item.
 *
 * If the sector that teaches the tool has not been passed, say so — buying a
 * combustion analyser before sector 8 is money spent on an instrument you cannot
 * yet read. Otherwise, say what it unlocks on a call.
 */
function shopNote(
  enables: number,
  taughtIn: string | undefined,
  studied: boolean,
): HTMLElement | null {
  if (taughtIn && !studied) {
    return h('p', { class: 'tool-enables tool-warn', text: `Covered in ${taughtIn}` });
  }
  if (enables === 0) return null;
  return h('p', {
    class: 'tool-enables',
    text: `Unlocks ${enables} reading${enables === 1 ? '' : 's'} on a call`,
  });
}

// ---------------------------------------------------------------------------
// Logbook
// ---------------------------------------------------------------------------

export interface LogContext {
  readonly state: CareerState;
  readonly passedSectors: ReadonlySet<string>;
  readonly sectorTitles: ReadonlyMap<string, string>;
  onBack(): void;
}

export function renderLogbook(ctx: LogContext): HTMLElement {
  const { state } = ctx;
  const root = h('div', { class: 'career' });

  root.appendChild(
    h(
      'header',
      { class: 'career-head' },
      h(
        'div',
        { class: 'career-head-top' },
        h(
          'div',
          { class: 'career-identity' },
          h('h1', { text: 'Logbook' }),
          h('span', { class: 'career-day', text: `Day ${state.day}` }),
        ),
        h('button', { class: 'btn btn-ghost', onClick: ctx.onBack, text: 'Back' }),
      ),
    ),
  );

  // --- the career so far -----------------------------------------------------
  root.appendChild(
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'The record' }),
      h(
        'div',
        { class: 'record-grid' },
        record('Jobs completed', String(state.jobsCompleted)),
        record('Callbacks', String(state.jobsFailed)),
        record('Lifetime earnings', `$${state.earned.toLocaleString()}`),
        record('Standing', String(state.reputation)),
      ),
    ),
  );

  // --- the ladder ------------------------------------------------------------
  const ladder = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'The ladder' }),
  );
  const held = rankIndex(state.rank);
  for (const [i, r] of RANKS.entries()) {
    const status = i < held ? 'past' : i === held ? 'now' : 'ahead';
    const missing = r.requiresSectors.filter((s) => !ctx.passedSectors.has(s));

    ladder.appendChild(
      h(
        'div',
        { class: `rung rung-${status}` },
        h(
          'div',
          { class: 'rung-head' },
          h('span', { class: 'rung-title', text: r.title }),
          h('span', { class: 'rung-cut', text: `keeps ${Math.round(r.cut * 100)}%` }),
        ),
        h('p', { class: 'rung-blurb', text: r.blurb }),
        status === 'ahead'
          ? h('p', {
              class: 'rung-needs',
              text: [
                missing.length > 0
                  ? `pass ${sectorList(missing, ctx.sectorTitles)}`
                  : undefined,
                r.requiresJobs > state.jobsCompleted
                  ? `${r.requiresJobs - state.jobsCompleted} more jobs`
                  : undefined,
                r.requiresEarned > state.earned
                  ? `$${(r.requiresEarned - state.earned).toLocaleString()} more earned`
                  : undefined,
              ]
                .filter(Boolean)
                .join(' · ') || 'all requirements met',
            })
          : null,
      ),
    );
  }
  root.appendChild(ladder);

  // --- the diary --------------------------------------------------------------
  const diary = h('section', { class: 'panel' }, h('h2', { class: 'panel-title', text: 'Recent days' }));
  if (state.log.length === 0) {
    diary.appendChild(h('p', { class: 'panel-note', text: 'Nothing logged yet.' }));
  } else {
    let lastDay: number | undefined;
    for (const entry of state.log) {
      if (entry.day !== lastDay) {
        diary.appendChild(h('h3', { class: 'measure-group', text: `Day ${entry.day}` }));
        lastDay = entry.day;
      }
      diary.appendChild(renderEvent(entry));
    }
  }
  root.appendChild(diary);

  return root;
}

function renderEvent(entry: CareerEvent): HTMLElement {
  return h(
    'div',
    { class: `log-entry log-${entry.kind}` },
    h('span', { class: 'log-text', text: entry.text }),
    entry.money === undefined
      ? null
      : h('span', {
          class: `log-money ${entry.money < 0 ? 'log-money-out' : ''}`,
          text: entry.money < 0 ? `−$${Math.abs(entry.money)}` : `+$${entry.money}`,
        }),
  );
}

/**
 * Name the first few sectors and count the rest.
 *
 * Owner needs all ten, and printing all ten titles turns a one-line requirement
 * into a paragraph nobody reads.
 */
function sectorList(ids: readonly string[], titles: ReadonlyMap<string, string>): string {
  const named = ids.slice(0, 3).map((s) => titles.get(s) ?? s);
  const rest = ids.length - named.length;
  return rest > 0 ? `${named.join(', ')} and ${rest} more` : named.join(', ');
}

function record(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'record' },
    h('span', { class: 'record-label', text: label }),
    h('span', { class: 'record-value', text: value }),
  );
}

// ---------------------------------------------------------------------------
// Day summary
// ---------------------------------------------------------------------------

export interface DaySummaryContext {
  readonly summary: DaySummary;
  readonly state: CareerState;
  readonly events: readonly CareerEvent[];
  onContinue(): void;
}

/** The end-of-day card: what happened, what it cost, what tomorrow looks like. */
export function renderDaySummary(ctx: DaySummaryContext): HTMLElement {
  const { summary, state } = ctx;
  const net = summary.netToday;

  const root = h('div', { class: 'career career-intro' });

  const card = h(
    'section',
    { class: 'panel intro-card' },
    h('span', { class: 'intro-label', text: `Day ${summary.day}` }),
    h('h1', { class: 'intro-title', text: net >= 0 ? `$${net} to the good` : `$${Math.abs(net)} down` }),
    h('p', {
      class: 'intro-body',
      text:
        summary.jobsToday === 0
          ? 'No work today. It happens, and it is usually the day you should have spent studying.'
          : `${summary.jobsToday} job${summary.jobsToday === 1 ? '' : 's'} worked, $${summary.earnedToday} in` +
            (summary.overhead > 0 ? `, $${summary.overhead} out on fuel and stock.` : '.'),
    }),
  );

  // The card is the day's summary, so the day's own log line would only repeat
  // the headline back at the reader.
  const entries = ctx.events.filter((e) => e.kind !== 'day');
  if (entries.length > 0) {
    const list = h('div', { class: 'day-events' });
    for (const entry of entries) list.appendChild(renderEvent(entry));
    card.appendChild(list);
  }

  card.appendChild(
    h('p', {
      class: 'intro-body intro-quiet',
      text: `Tomorrow: day ${state.day}, ${rank(state.rank).title.toLowerCase()}, $${state.money.toLocaleString()} in hand.`,
    }),
  );
  card.appendChild(
    h('button', { class: 'btn btn-primary', onClick: ctx.onContinue, text: 'Next morning' }),
  );

  root.appendChild(card);
  return root;
}

/** Names of the tools a job needs, for the job briefing. */
export function toolNames(ids: readonly ToolId[]): string {
  return ids.map((id) => tool(id).name.toLowerCase()).join(', ');
}
