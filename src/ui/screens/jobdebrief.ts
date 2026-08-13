import { gradeLabel, type JobGrade } from '@career/career';
import type { CareerState, Job } from '@career/types';
import { district, rank } from '@career/world';
import { h } from '../dom';

export interface JobPayoff {
  readonly job: Job;
  readonly grade: JobGrade;
  readonly paid: number;
  readonly reputationDelta: number;
  readonly summary: string;
  /** Set when the job pushed you up a rank. */
  readonly promotedTo?: string;
  /** For knowledge jobs: what you actually scored. */
  readonly percent?: number;
  /** The sector this work leans on, offered as a way out after a bad call. */
  readonly studySector?: { readonly id: string; readonly title: string };
}

export interface JobDebriefContext {
  readonly payoff: JobPayoff;
  readonly state: CareerState;
  onStudy(sectorId: string): void;
  onBack(): void;
}

/**
 * What the call was worth.
 *
 * Deliberately short. The teaching already happened — during the questions, or
 * in the service-call debrief — and stacking a second wall of text after it
 * would only get skipped. This is the receipt.
 */
export function renderJobDebrief(ctx: JobDebriefContext): HTMLElement {
  const { payoff, state } = ctx;
  const good = payoff.grade === 'clean' || payoff.grade === 'correct';

  const root = h('div', { class: 'career career-intro' });

  const card = h(
    'section',
    { class: 'panel intro-card' },
    h('span', { class: 'intro-label', text: `${payoff.job.client} · ${district(payoff.job.district).name}` }),
    h('h1', { class: 'intro-title', text: gradeLabel(payoff.grade) }),
    h('p', { class: 'intro-body', text: payoff.summary }),
  );

  const ledger = h('div', { class: 'record-grid' });
  ledger.appendChild(line('Paid', payoff.paid === 0 ? 'nothing' : `$${payoff.paid}`));
  ledger.appendChild(
    line(
      'Standing',
      payoff.reputationDelta === 0
        ? 'unchanged'
        : payoff.reputationDelta > 0
          ? `+${payoff.reputationDelta}`
          : String(payoff.reputationDelta),
    ),
  );
  if (payoff.percent !== undefined) ledger.appendChild(line('Score', `${payoff.percent}%`));
  ledger.appendChild(line('Left today', `${state.minutesLeft} min`));
  card.appendChild(ledger);

  if (payoff.promotedTo) {
    card.appendChild(
      h('p', {
        class: 'promotion',
        text: `You are a ${payoff.promotedTo} now. You keep ${Math.round(rank(state.rank).cut * 100)}% of every ticket.`,
      }),
    );
  }

  if (!good) {
    card.appendChild(
      h('p', {
        class: 'intro-body intro-quiet',
        text:
          payoff.grade === 'wrong'
            ? 'Word gets around. This is the kind of call that is worth reading up on before the next one.'
            : 'It got fixed. Nobody is going to recommend you for it.',
      }),
    );
  }

  // After a bad call, the way out is named and one click away. Sending someone
  // back to a board they already could not work would be a dead end.
  const actions = h('div', { class: 'debrief-actions' });
  actions.appendChild(
    h('button', {
      class: `btn ${good ? 'btn-primary' : 'btn-quiet'}`,
      onClick: ctx.onBack,
      text: 'Back to the board',
    }),
  );
  if (!good && payoff.studySector) {
    const sector = payoff.studySector;
    actions.appendChild(
      h('button', {
        class: 'btn btn-primary',
        onClick: () => ctx.onStudy(sector.id),
        text: `Read ${sector.title}`,
      }),
    );
  }
  card.appendChild(actions);

  root.appendChild(card);
  return root;
}

function line(label: string, value: string): HTMLElement {
  return h(
    'div',
    { class: 'record' },
    h('span', { class: 'record-label', text: label }),
    h('span', { class: 'record-value', text: value }),
  );
}
