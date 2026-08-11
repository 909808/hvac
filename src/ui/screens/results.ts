import { describeAnswer } from '@engine/grade';
import type { AnsweredItem, SessionSnapshot } from '@engine/session';
import { h, paragraphs } from '../dom';
import { modeById, type ModeId } from '../modes';

export interface ResultsContext {
  readonly snapshot: SessionSnapshot;
  readonly mode: ModeId;
  readonly seed: number;
  readonly previousBest: number;
  onReplay(): void;
  onHome(): void;
}

/** CompTIA reports Network+ on an 100–900 scale with 720 to pass. */
const EXAM_PASS_PERCENT = 80;

export function renderResults(ctx: ResultsContext): HTMLElement {
  const snap = ctx.snapshot;
  const mode = modeById(ctx.mode);
  const asked = snap.answered.length;
  const percent = asked === 0 ? 0 : Math.round((snap.correctCount / asked) * 100);
  const isExam = ctx.mode === 'exam';
  const passed = percent >= EXAM_PASS_PERCENT;
  const newBest = snap.score > ctx.previousBest;

  const root = h('div', { class: 'results' });

  root.appendChild(
    h(
      'header',
      { class: 'results-head panel' },
      h('span', { class: 'results-mode', text: mode.name }),
      h('h1', {
        class: 'results-score',
        text: isExam ? `${percent}%` : snap.score.toLocaleString(),
      }),
      h('p', {
        class: 'results-line',
        text: `${snap.correctCount} of ${asked} correct · best streak ${snap.bestStreak}`,
      }),
      isExam
        ? h('p', {
            class: `results-verdict ${passed ? 'verdict-pass' : 'verdict-fail'}`,
            text: passed
              ? `At or above the ${EXAM_PASS_PERCENT}% practice threshold`
              : `Below the ${EXAM_PASS_PERCENT}% practice threshold`,
          })
        : newBest
          ? h('p', { class: 'results-verdict verdict-pass', text: 'New personal best' })
          : null,
      h(
        'div',
        { class: 'results-actions' },
        h('button', { class: 'btn btn-primary', onClick: ctx.onReplay, text: 'Play again' }),
        h('button', { class: 'btn btn-ghost', onClick: ctx.onHome, text: 'Back to menu' }),
      ),
      h('p', { class: 'results-seed', text: `Seed ${ctx.seed}` }),
    ),
  );

  // Per-objective breakdown, so a bad run points at what to study rather than
  // just delivering a number.
  const byObjective = new Map<string, { right: number; total: number }>();
  for (const item of snap.answered) {
    const key = `${item.question.domain} · ${item.question.objective}`;
    const entry = byObjective.get(key) ?? { right: 0, total: 0 };
    entry.total++;
    if (item.judgement.correct) entry.right++;
    byObjective.set(key, entry);
  }

  if (byObjective.size > 1) {
    const breakdown = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'By objective' }),
    );
    const rows = h('div', { class: 'breakdown' });
    for (const [key, entry] of [...byObjective.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { numeric: true }),
    )) {
      const share = entry.right / entry.total;
      rows.appendChild(
        h(
          'div',
          { class: 'breakdown-row' },
          h('span', { class: 'breakdown-key', text: key }),
          h(
            'span',
            { class: 'breakdown-track' },
            h('span', {
              class: `breakdown-fill ${share < 0.6 ? 'breakdown-weak' : ''}`,
              style: `width: ${share * 100}%`,
            }),
          ),
          h('span', { class: 'breakdown-num', text: `${entry.right}/${entry.total}` }),
        ),
      );
    }
    breakdown.appendChild(rows);
    root.appendChild(breakdown);
  }

  const missed = snap.answered.filter((a) => !a.judgement.correct);
  if (missed.length > 0) {
    const review = h(
      'section',
      { class: 'panel' },
      h('h2', {
        class: 'panel-title',
        text: `Review — ${missed.length} missed`,
      }),
    );
    for (const item of missed) review.appendChild(renderMissed(item));
    root.appendChild(review);
  }

  return root;
}

function renderMissed(item: AnsweredItem): HTMLElement {
  const q = item.question;
  const wrap = h('details', { class: 'missed' });

  wrap.appendChild(
    h(
      'summary',
      {},
      h('span', { class: 'chip', text: `${q.domain} · ${q.objective}` }),
      h('span', { class: 'missed-prompt', text: firstLine(q.prompt) }),
    ),
  );

  wrap.appendChild(paragraphs(q.prompt, 'missed-full'));
  wrap.appendChild(
    h(
      'div',
      { class: 'reveal-answer' },
      h('span', { class: 'reveal-answer-label', text: 'Answer' }),
      h('span', { class: 'pre-line', text: describeAnswer(q) }),
    ),
  );
  wrap.appendChild(paragraphs(q.explain, 'reveal-explain'));

  return wrap;
}

function firstLine(text: string): string {
  const line = text.split('\n')[0] ?? text;
  return line.length > 110 ? `${line.slice(0, 107)}…` : line;
}
