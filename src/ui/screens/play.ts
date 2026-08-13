import { describeAnswer } from '@engine/grade';
import type { Session } from '@engine/session';
import type { Question, Response, Source } from '@engine/types';
import { BOOKS } from '@content/index';
import { formatDuration, h, paragraphs } from '../dom';
import { renderTopology } from '../topology';
import { modeById, type ModeId } from '../modes';

export interface PlayContext {
  readonly session: Session;
  readonly mode: ModeId;
  /** Stable per-question shuffle, so re-rendering does not reorder the options. */
  readonly shuffleSeed: number;
  onAnswer(response: Response): void;
  onNext(): void;
  onSkip(): void;
  onQuit(): void;
  rerender(): void;
}

/** Draft state the widgets accumulate before the player commits an answer. */
interface Draft {
  multi: Set<number>;
  input: string;
  order: number[];
  match: Record<number, number>;
  matchSelection: number | undefined;
}

let draft: Draft = freshDraft();

function freshDraft(): Draft {
  return { multi: new Set(), input: '', order: [], match: {}, matchSelection: undefined };
}

export function resetDraft(): void {
  draft = freshDraft();
}

export function renderPlay(ctx: PlayContext): HTMLElement {
  const snap = ctx.session.snapshot();
  const question = snap.question;

  if (!question) return h('div', { class: 'panel', text: 'No question to show.' });

  const root = h('div', { class: 'play' });
  root.appendChild(renderHud(ctx, snap));

  const card = h('div', { class: 'panel question-card' });

  // Just the objective. Difficulty would bias the answer before it is given,
  // and the draft badge is information the author needs, not the learner —
  // it still appears on the citation line after answering.
  card.appendChild(
    h(
      'div',
      { class: 'question-meta' },
      h('span', { class: 'objective-tag', text: `${question.domain} · ${question.objective}` }),
    ),
  );

  // A hotspot question renders its own diagram as the answer widget, so drawing
  // it here as well would show it twice.
  if (question.topology && question.kind !== 'hotspot') {
    const figure = h('figure', { class: 'topology-wrap' }, renderTopology(question.topology));
    if (question.topology.caption) {
      figure.appendChild(h('figcaption', { text: question.topology.caption }));
    }
    card.appendChild(figure);
  }

  card.appendChild(paragraphs(question.prompt, 'prompt'));
  card.appendChild(renderWidget(ctx, question, snap.phase === 'revealed'));

  if (snap.phase === 'revealed') card.appendChild(renderReveal(ctx, question));

  root.appendChild(card);
  return root;
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

function renderHud(ctx: PlayContext, snap: ReturnType<Session['snapshot']>): HTMLElement {
  const mode = modeById(ctx.mode);
  const timeLeft = ctx.session.timeLeftSec();

  // Only show a stat once it says something. A permanent "SCORE 0 · STREAK 0"
  // is noise on every screen for the whole first question.
  const stats = h(
    'div',
    { class: 'hud-stats' },
    snap.score > 0 ? stat('Score', snap.score.toLocaleString()) : null,
    snap.streak >= 2 ? stat('Streak', `${snap.streak}${snap.streak >= 4 ? ' ✦' : ''}`) : null,
    snap.livesLeft === undefined
      ? null
      : stat('Lives', '●'.repeat(Math.max(0, snap.livesLeft)) || '—'),
    timeLeft === undefined
      ? null
      : stat('Time', formatDuration(timeLeft), timeLeft <= 30 ? 'stat-urgent' : undefined),
  );

  const progress = h(
    'div',
    { class: 'progress-track' },
    h('div', {
      class: 'progress-fill',
      style: `width: ${(snap.index / snap.total) * 100}%`,
    }),
  );

  return h(
    'header',
    { class: 'hud' },
    h(
      'div',
      { class: 'hud-top' },
      h(
        'div',
        { class: 'hud-title' },
        h('span', { class: 'hud-glyph', text: mode.glyph }),
        h('span', { text: mode.name }),
        h('span', { class: 'hud-count', text: `${snap.index + 1} / ${snap.total}` }),
      ),
      stats,
      h('button', { class: 'btn btn-ghost', onClick: ctx.onQuit, text: 'End run' }),
    ),
    progress,
  );
}

function stat(label: string, value: string, extra?: string): HTMLElement {
  return h(
    'div',
    { class: `stat ${extra ?? ''}` },
    h('span', { class: 'stat-label', text: label }),
    h('span', { class: 'stat-value', text: value }),
  );
}


// ---------------------------------------------------------------------------
// Answer widgets
// ---------------------------------------------------------------------------

function renderWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  switch (question.kind) {
    case 'choice':
      return choiceWidget(ctx, question, revealed);
    case 'multi':
      return multiWidget(ctx, question, revealed);
    case 'input':
      return inputWidget(ctx, question, revealed);
    case 'order':
      return orderWidget(ctx, question, revealed);
    case 'match':
      return matchWidget(ctx, question, revealed);
    case 'hotspot':
      return hotspotWidget(ctx, question, revealed);
  }
}

function hotspotWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'hotspot') throw new Error('wrong widget');
  const snap = ctx.session.snapshot();
  const last = snap.answered[snap.answered.length - 1];
  const chosen = revealed && last?.response.kind === 'hotspot' ? last.response.nodeId : undefined;

  const wrap = h('div', { class: 'hotspot' });

  wrap.appendChild(
    h(
      'figure',
      { class: 'topology-wrap' },
      renderTopology(question.topology, {
        onPick: (nodeId) => ctx.onAnswer({ kind: 'hotspot', nodeId }),
        disabled: revealed,
        ...(revealed ? { correct: question.answer } : {}),
        ...(chosen ? { chosen } : {}),
      }),
    ),
  );

  if (!revealed) {
    wrap.appendChild(h('p', { class: 'hint', text: 'Click the component on the diagram.' }));
  } else if (chosen && chosen !== question.answer) {
    const note = question.whyWrong?.[chosen];
    if (note) wrap.appendChild(h('p', { class: 'choice-note', text: note }));
  }

  return wrap;
}

/**
 * Shuffle order derived from the seed and the question id, so options are mixed
 * but stable across re-renders — otherwise the list would jump under the cursor.
 */
function shuffledIndices(count: number, seed: number, id: string): number[] {
  let hash = seed >>> 0;
  for (const ch of id) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, (_, i) => i)
    .map((i) => ({ i, k: Math.imul(hash ^ (i + 1), 2654435761) >>> 0 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.i);
}

function choiceWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'choice') throw new Error('wrong widget');
  const snap = ctx.session.snapshot();
  const given = revealed
    ? snap.answered[snap.answered.length - 1]?.response
    : undefined;
  const chosen = given?.kind === 'choice' ? given.index : undefined;

  const list = h('div', { class: 'choices' });
  const order = shuffledIndices(question.choices.length, ctx.shuffleSeed, question.id);

  order.forEach((original, position) => {
    const isAnswer = original === question.answer;
    const isChosen = original === chosen;
    const classes = ['choice'];
    if (revealed && isAnswer) classes.push('choice-correct');
    if (revealed && isChosen && !isAnswer) classes.push('choice-wrong');

    const button = h(
      'button',
      {
        class: classes.join(' '),
        disabled: revealed,
        onClick: () => ctx.onAnswer({ kind: 'choice', index: original }),
      },
      h('span', { class: 'choice-key', text: String(position + 1) }),
      h('span', { class: 'choice-text', text: question.choices[original] ?? '' }),
    );

    list.appendChild(button);

    const note = revealed && !isAnswer ? question.whyWrong?.[original] : undefined;
    if (note) list.appendChild(h('p', { class: 'choice-note', text: note }));
  });

  return list;
}

function multiWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'multi') throw new Error('wrong widget');
  const correct = new Set(question.answers);
  const list = h('div', { class: 'choices' });
  const order = shuffledIndices(question.choices.length, ctx.shuffleSeed, question.id);

  order.forEach((original, position) => {
    const selected = draft.multi.has(original);
    const classes = ['choice', 'choice-multi'];
    if (selected && !revealed) classes.push('choice-selected');
    if (revealed && correct.has(original)) classes.push('choice-correct');
    if (revealed && selected && !correct.has(original)) classes.push('choice-wrong');

    list.appendChild(
      h(
        'button',
        {
          class: classes.join(' '),
          disabled: revealed,
          onClick: () => {
            if (selected) draft.multi.delete(original);
            else draft.multi.add(original);
            ctx.rerender();
          },
        },
        h('span', { class: 'choice-key', text: selected ? '✓' : String(position + 1) }),
        h('span', { class: 'choice-text', text: question.choices[original] ?? '' }),
      ),
    );
  });

  if (!revealed) {
    list.appendChild(
      h(
        'div',
        { class: 'widget-actions' },
        h('span', {
          class: 'hint',
          text: `Select all that apply — ${draft.multi.size} selected`,
        }),
        h('button', {
          class: 'btn btn-primary',
          disabled: draft.multi.size === 0,
          onClick: () => ctx.onAnswer({ kind: 'multi', indices: [...draft.multi] }),
          text: 'Submit',
        }),
      ),
    );
  }

  return list;
}

function inputWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'input') throw new Error('wrong widget');
  const snap = ctx.session.snapshot();
  const last = snap.answered[snap.answered.length - 1];
  const given = revealed && last?.response.kind === 'input' ? last.response.text : draft.input;
  const wasCorrect = revealed && last?.judgement.correct;

  const field = h('input', {
    class: `text-input ${revealed ? (wasCorrect ? 'input-correct' : 'input-wrong') : ''}`,
    type: 'text',
    value: given,
    placeholder: question.placeholder ?? 'Your answer',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    disabled: revealed,
    onInput: (e: Event) => {
      draft.input = (e.target as HTMLInputElement).value;
    },
    onKeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' && draft.input.trim()) {
        ctx.onAnswer({ kind: 'input', text: draft.input });
      }
    },
  });

  // Focus without fighting the browser's own restore behaviour.
  queueMicrotask(() => {
    if (!revealed) field.focus();
  });

  const row = h('div', { class: 'input-row' }, field);
  if (!revealed) {
    row.appendChild(
      h('button', {
        class: 'btn btn-primary',
        onClick: () => ctx.onAnswer({ kind: 'input', text: draft.input }),
        text: 'Submit',
      }),
    );
  }
  return row;
}

function orderWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'order') throw new Error('wrong widget');

  if (draft.order.length !== question.steps.length) {
    draft.order = shuffledIndices(question.steps.length, ctx.shuffleSeed, question.id);
  }

  const list = h('ol', { class: 'order-list' });

  draft.order.forEach((original, position) => {
    const inPlace = revealed && original === position;
    const classes = ['order-item'];
    if (revealed) classes.push(inPlace ? 'order-right' : 'order-wrong');

    const move = (delta: number) => {
      const target = position + delta;
      if (target < 0 || target >= draft.order.length) return;
      const next = [...draft.order];
      const a = next[position]!;
      next[position] = next[target]!;
      next[target] = a;
      draft.order = next;
      ctx.rerender();
    };

    list.appendChild(
      h(
        'li',
        { class: classes.join(' ') },
        h('span', { class: 'order-num', text: String(position + 1) }),
        h('span', { class: 'order-text', text: question.steps[original] ?? '' }),
        revealed
          ? null
          : h(
              'span',
              { class: 'order-controls' },
              h('button', {
                class: 'btn btn-icon',
                'aria-label': 'Move up',
                disabled: position === 0,
                onClick: () => move(-1),
                text: '↑',
              }),
              h('button', {
                class: 'btn btn-icon',
                'aria-label': 'Move down',
                disabled: position === draft.order.length - 1,
                onClick: () => move(1),
                text: '↓',
              }),
            ),
      ),
    );
  });

  const wrap = h('div', {}, list);
  if (!revealed) {
    wrap.appendChild(
      h(
        'div',
        { class: 'widget-actions' },
        h('span', { class: 'hint', text: 'Arrange with the arrows, then submit' }),
        h('button', {
          class: 'btn btn-primary',
          onClick: () => ctx.onAnswer({ kind: 'order', order: draft.order }),
          text: 'Submit',
        }),
      ),
    );
  }
  return wrap;
}

function matchWidget(ctx: PlayContext, question: Question, revealed: boolean): HTMLElement {
  if (question.kind !== 'match') throw new Error('wrong widget');

  const rightOrder = shuffledIndices(question.pairs.length, ctx.shuffleSeed, question.id);
  const usedRight = new Set(Object.values(draft.match));

  const grid = h('div', { class: 'match-grid' });

  const leftCol = h('div', { class: 'match-col' });
  question.pairs.forEach(([left], leftIndex) => {
    const paired = draft.match[leftIndex];
    const classes = ['match-item', 'match-left'];
    if (draft.matchSelection === leftIndex) classes.push('match-active');
    if (paired !== undefined) classes.push('match-paired');
    if (revealed) classes.push(paired === leftIndex ? 'match-right-answer' : 'match-wrong-answer');

    leftCol.appendChild(
      h(
        'button',
        {
          class: classes.join(' '),
          disabled: revealed,
          onClick: () => {
            if (paired !== undefined) {
              const next = { ...draft.match };
              delete next[leftIndex];
              draft.match = next;
              draft.matchSelection = leftIndex;
            } else {
              draft.matchSelection = draft.matchSelection === leftIndex ? undefined : leftIndex;
            }
            ctx.rerender();
          },
        },
        h('span', { class: 'match-text', text: left }),
        paired === undefined
          ? null
          : h('span', { class: 'match-badge', text: question.pairs[paired]?.[1] ?? '' }),
      ),
    );
  });

  const rightCol = h('div', { class: 'match-col' });
  rightOrder.forEach((rightIndex) => {
    const taken = usedRight.has(rightIndex);
    const classes = ['match-item', 'match-right'];
    if (taken) classes.push('match-used');

    rightCol.appendChild(
      h(
        'button',
        {
          class: classes.join(' '),
          disabled: revealed || taken,
          onClick: () => {
            if (draft.matchSelection === undefined) return;
            draft.match = { ...draft.match, [draft.matchSelection]: rightIndex };
            draft.matchSelection = undefined;
            ctx.rerender();
          },
        },
        h('span', { class: 'match-text', text: question.pairs[rightIndex]?.[1] ?? '' }),
      ),
    );
  });

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);

  const wrap = h('div', {}, grid);
  if (!revealed) {
    const complete = Object.keys(draft.match).length === question.pairs.length;
    wrap.appendChild(
      h(
        'div',
        { class: 'widget-actions' },
        h('span', {
          class: 'hint',
          text: draft.matchSelection === undefined
            ? 'Pick an item on the left, then its match on the right'
            : 'Now choose its match on the right',
        }),
        h('button', {
          class: 'btn btn-primary',
          disabled: !complete,
          onClick: () => ctx.onAnswer({ kind: 'match', mapping: draft.match }),
          text: 'Submit',
        }),
      ),
    );
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Reveal
// ---------------------------------------------------------------------------

function renderReveal(ctx: PlayContext, question: Question): HTMLElement {
  const snap = ctx.session.snapshot();
  const last = snap.answered[snap.answered.length - 1];
  const judgement = last?.judgement;
  const correct = judgement?.correct ?? false;
  const partial = !correct && (judgement?.credit ?? 0) > 0;

  const verdict = correct ? 'Correct' : partial ? 'Partly right' : 'Not quite';

  const panel = h(
    'div',
    { class: `reveal reveal-${correct ? 'ok' : partial ? 'partial' : 'bad'}` },
    h(
      'div',
      { class: 'reveal-head' },
      h('strong', { text: verdict }),
      last && last.points > 0 ? h('span', { class: 'reveal-points', text: `+${last.points}` }) : null,
    ),
  );

  if (!correct) {
    panel.appendChild(
      h(
        'div',
        { class: 'reveal-answer' },
        h('span', { class: 'reveal-answer-label', text: 'Answer' }),
        h('span', { class: 'pre-line', text: describeAnswer(question) }),
      ),
    );
  }

  panel.appendChild(paragraphs(question.explain, 'reveal-explain'));
  panel.appendChild(renderCitation(question.source));

  panel.appendChild(
    h(
      'div',
      { class: 'widget-actions' },
      h('span', { class: 'hint', text: 'Press Enter to continue' }),
      h('button', { class: 'btn btn-primary', onClick: ctx.onNext, text: 'Continue' }),
    ),
  );

  return panel;
}

function renderCitation(source: Source): HTMLElement {
  switch (source.kind) {
    case 'book': {
      const book = BOOKS.find((b) => b.id === source.book);
      const label = book ? `${book.title} (${book.edition} ed.)` : source.book;
      return h(
        'p',
        { class: 'citation' },
        h('span', { class: 'citation-label', text: 'Source' }),
        `${label}, p. ${source.pages}`,
      );
    }
    case 'standard':
      return h(
        'p',
        { class: 'citation' },
        h('span', { class: 'citation-label', text: 'Source' }),
        source.ref,
      );
    case 'generated':
      return h(
        'p',
        { class: 'citation' },
        h('span', { class: 'citation-label', text: 'Source' }),
        'Computed from the addressing arithmetic',
      );
    case 'uncited':
      return h(
        'p',
        { class: 'citation citation-todo' },
        h('span', { class: 'citation-label', text: 'Unverified' }),
        source.note,
      );
  }
}
