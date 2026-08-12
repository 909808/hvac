import type { Lesson, LessonSection } from '@engine/lesson';
import type { Source } from '@engine/types';
import { BOOKS } from '@content/index';
import { appendInline, h, paragraphs } from '../dom';
import { renderTopology } from '../topology';

export interface LessonContext {
  readonly lessons: readonly Lesson[];
  readonly index: number;
  readonly sectorTitle: string;
  onNavigate(index: number): void;
  onStartQuestions(): void;
  onHome(): void;
}

/** Worked-example steps the reader has chosen to reveal, keyed by section id. */
const revealed = new Map<string, number>();

export function resetLessonState(): void {
  revealed.clear();
}

export function renderLesson(ctx: LessonContext): HTMLElement {
  const lesson = ctx.lessons[ctx.index];
  if (!lesson) return h('div', { class: 'panel', text: 'No lesson to show.' });

  const root = h('div', { class: 'lesson' });

  // --- header ---------------------------------------------------------------
  root.appendChild(
    h(
      'header',
      { class: 'lesson-head' },
      h('button', { class: 'btn btn-ghost', onClick: ctx.onHome, text: '← Sectors' }),
      h(
        'div',
        { class: 'lesson-crumb' },
        h('span', { class: 'lesson-sector', text: ctx.sectorTitle }),
        h('span', {
          class: 'lesson-position',
          text: `Lesson ${ctx.index + 1} of ${ctx.lessons.length} · ${lesson.minutes} min`,
        }),
      ),
    ),
  );

  // --- progress across the sector's lessons ---------------------------------
  if (ctx.lessons.length > 1) {
    const dots = h('nav', { class: 'lesson-dots' });
    ctx.lessons.forEach((entry, i) => {
      dots.appendChild(
        h('button', {
          class: `lesson-dot ${i === ctx.index ? 'lesson-dot-active' : ''} ${i < ctx.index ? 'lesson-dot-done' : ''}`,
          title: entry.title,
          'aria-label': entry.title,
          onClick: () => ctx.onNavigate(i),
        }),
      );
    });
    root.appendChild(dots);
  }

  // --- the lesson ------------------------------------------------------------
  const body = h('article', { class: 'panel lesson-body' });
  body.appendChild(h('h1', { class: 'lesson-title', text: lesson.title }));
  body.appendChild(h('p', { class: 'lesson-summary', text: lesson.summary }));

  lesson.sections.forEach((section, i) => {
    body.appendChild(renderSection(section, `${lesson.id}.${i}`, ctx));
  });

  body.appendChild(renderCitation(lesson.source, lesson.status));
  root.appendChild(body);

  // --- navigation --------------------------------------------------------------
  const nav = h('div', { class: 'lesson-nav' });

  nav.appendChild(
    h('button', {
      class: 'btn btn-ghost',
      disabled: ctx.index === 0,
      onClick: () => ctx.onNavigate(ctx.index - 1),
      text: '← Previous',
    }),
  );

  const isLast = ctx.index === ctx.lessons.length - 1;
  nav.appendChild(
    isLast
      ? h('button', {
          class: 'btn btn-primary',
          onClick: ctx.onStartQuestions,
          text: 'Practise this sector →',
        })
      : h('button', {
          class: 'btn btn-primary',
          onClick: () => ctx.onNavigate(ctx.index + 1),
          text: 'Next lesson →',
        }),
  );

  root.appendChild(nav);
  return root;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function renderSection(section: LessonSection, key: string, ctx: LessonContext): HTMLElement {
  switch (section.kind) {
    case 'prose': {
      const wrap = h('section', { class: 'lesson-section' });
      if (section.heading) wrap.appendChild(h('h2', { class: 'lesson-heading', text: section.heading }));
      wrap.appendChild(paragraphs(section.body, 'lesson-prose'));
      return wrap;
    }

    case 'keyNumbers': {
      const wrap = h(
        'section',
        { class: 'lesson-section key-numbers' },
        h('h2', { class: 'lesson-heading', text: section.heading }),
      );
      const grid = h('div', { class: 'key-grid' });
      for (const item of section.items) {
        grid.appendChild(
          h(
            'div',
            { class: 'key-item' },
            h('span', { class: 'key-value', text: item.value }),
            h('span', { class: 'key-label', text: item.label }),
            item.note ? h('span', { class: 'key-note', text: item.note }) : null,
          ),
        );
      }
      wrap.appendChild(grid);
      return wrap;
    }

    case 'diagram': {
      const wrap = h('section', { class: 'lesson-section' });
      if (section.heading) wrap.appendChild(h('h2', { class: 'lesson-heading', text: section.heading }));
      const figure = h('figure', { class: 'topology-wrap' }, renderTopology(section.topology));
      const caption = section.caption ?? section.topology.caption;
      if (caption) figure.appendChild(h('figcaption', { text: caption }));
      wrap.appendChild(figure);
      return wrap;
    }

    case 'worked': {
      const shown = revealed.get(key) ?? 0;
      const wrap = h(
        'section',
        { class: 'lesson-section worked' },
        h('h2', { class: 'lesson-heading', text: section.heading }),
      );
      const problem = h('p', { class: 'worked-problem pre-line' });
      appendInline(problem, section.problem);
      wrap.appendChild(problem);

      const steps = h('ol', { class: 'worked-steps' });
      section.steps.slice(0, shown).forEach((step) => {
        steps.appendChild(
          h(
            'li',
            { class: 'worked-step' },
            h('span', { class: 'worked-action', text: step.action }),
            h('span', { class: 'worked-result', text: step.result }),
          ),
        );
      });
      wrap.appendChild(steps);

      if (shown < section.steps.length) {
        wrap.appendChild(
          h(
            'div',
            { class: 'worked-actions' },
            h('span', {
              class: 'hint',
              text: shown === 0 ? 'Try it yourself first.' : 'What comes next?',
            }),
            h('button', {
              class: 'btn btn-ghost',
              onClick: () => {
                revealed.set(key, shown + 1);
                ctx.onNavigate(ctx.index);
              },
              text: shown === 0 ? 'Show the first step' : 'Show the next step',
            }),
          ),
        );
      } else {
        wrap.appendChild(
          h(
            'p',
            { class: 'worked-answer' },
            h('span', { class: 'worked-answer-label', text: 'Answer' }),
            section.answer,
          ),
        );
        if (section.moral) {
          wrap.appendChild(h('p', { class: 'worked-moral pre-line', text: section.moral }));
        }
      }

      return wrap;
    }

    case 'table': {
      const wrap = h(
        'section',
        { class: 'lesson-section' },
        h('h2', { class: 'lesson-heading', text: section.heading }),
      );
      const scroll = h('div', { class: 'table-scroll' });
      const table = h('table', { class: 'lesson-table' });

      const thead = h('thead');
      const headRow = h('tr');
      for (const column of section.columns) headRow.appendChild(h('th', { text: column }));
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = h('tbody');
      for (const row of section.rows) {
        const tr = h('tr');
        row.forEach((cell, i) => {
          const td = h(i === 0 ? 'th' : 'td', { scope: i === 0 ? 'row' : null });
          appendInline(td, cell);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      scroll.appendChild(table);
      wrap.appendChild(scroll);

      if (section.note) wrap.appendChild(h('p', { class: 'panel-note', text: section.note }));
      return wrap;
    }

    case 'callout': {
      const icon = { tip: '💡', warning: '⚠️', trap: '🪤' }[section.tone];
      return h(
        'aside',
        { class: `lesson-section callout callout-${section.tone}` },
        h(
          'div',
          { class: 'callout-head' },
          h('span', { class: 'callout-icon', text: icon }),
          h('strong', { text: section.heading }),
        ),
        paragraphs(section.body, 'callout-body'),
      );
    }
  }
}

function renderCitation(source: Source, status: string): HTMLElement {
  const label = status === 'verified' ? 'Source' : 'Unverified';
  const cls = status === 'verified' ? 'citation' : 'citation citation-todo';

  let text: string;
  switch (source.kind) {
    case 'book': {
      const book = BOOKS.find((b) => b.id === source.book);
      text = `${book ? `${book.title} (${book.edition} ed.)` : source.book}, p. ${source.pages}`;
      break;
    }
    case 'standard':
      text = source.ref;
      break;
    case 'generated':
      text = 'Computed';
      break;
    case 'uncited':
      text = source.note;
      break;
  }

  return h('p', { class: cls }, h('span', { class: 'citation-label', text: label }), text);
}
