import { fault, measurementDef, type FaultId, type MeasurementId } from '@games/hvac/system';
import { measurementGroups, type ServiceCallRun } from '@games/hvac/servicecall';
import { toolForMeasurement } from '@career/tools';
import { h, paragraphs } from '../dom';
import { renderCircuit } from '../circuit';

export interface ServiceCallContext {
  readonly run: ServiceCallRun;
  /**
   * Measurements the van can actually take. Omitted in Practice mode, where the
   * toolbox is idealised; supplied on career calls, where it is not.
   */
  readonly available?: ReadonlySet<MeasurementId>;
  /** Shown above the measurement list on career calls. */
  readonly headline?: string;
  /**
   * What the customer said when they booked the call.
   *
   * The simulator writes its own complaint from the fault it generated. On a
   * career job there is also the complaint that got the job onto the board, and
   * the two will not match — so the booked one becomes the work order and the
   * generated one becomes what they tell you at the door, which is how a real
   * call goes anyway.
   */
  readonly bookedComplaint?: string;
  /** Debrief button text. "Next call" in Practice, "Settle up" on a career job. */
  readonly replayLabel?: string;
  /** Abandon button text. */
  readonly leaveLabel?: string;
  onMeasure(id: MeasurementId): void;
  onDiagnose(id: FaultId): void;
  onReplay(): void;
  onHome(): void;
}

const TIME_BUDGET = 25;

export function renderServiceCall(ctx: ServiceCallContext): HTMLElement {
  return ctx.run.finished ? renderDebrief(ctx) : renderCall(ctx);
}

// ---------------------------------------------------------------------------
// The call in progress
// ---------------------------------------------------------------------------

function renderCall(ctx: ServiceCallContext): HTMLElement {
  const { run } = ctx;
  const { scenario } = run;
  const spec = scenario.spec;

  const root = h('div', { class: 'servicecall' });

  // --- header ---------------------------------------------------------------
  root.appendChild(
    h(
      'header',
      { class: 'hud' },
      h(
        'div',
        { class: 'hud-top' },
        h(
          'div',
          { class: 'hud-title' },
          h('span', { class: 'hud-glyph', text: '🔧' }),
          h('span', { text: ctx.headline ?? 'Service Call' }),
          h('span', { class: 'hud-count', text: `tier ${scenario.tier}` }),
        ),
        h(
          'div',
          { class: 'hud-stats' },
          h(
            'div',
            { class: `stat ${run.minutesUsed > TIME_BUDGET ? 'stat-urgent' : ''}` },
            h('span', { class: 'stat-label', text: 'On site' }),
            h('span', { class: 'stat-value', text: `${run.minutesUsed} min` }),
          ),
          h(
            'div',
            { class: 'stat' },
            h('span', { class: 'stat-label', text: 'Budget' }),
            h('span', { class: 'stat-value', text: `${TIME_BUDGET} min` }),
          ),
        ),
        h('button', {
          class: 'btn btn-ghost',
          onClick: ctx.onHome,
          text: ctx.leaveLabel ?? 'Leave call',
        }),
      ),
      h(
        'div',
        { class: 'progress-track' },
        h('div', {
          class: 'progress-fill',
          style: `width: ${Math.min(100, (run.minutesUsed / TIME_BUDGET) * 100)}%`,
        }),
      ),
    ),
  );

  // --- the call ticket -------------------------------------------------------
  root.appendChild(
    h(
      'section',
      { class: 'panel ticket' },
      h('h2', { class: 'panel-title', text: 'Work order' }),
      h('p', {
        class: 'ticket-complaint',
        text: `“${ctx.bookedComplaint ?? scenario.complaint}”`,
      }),
      ctx.bookedComplaint
        ? h('p', { class: 'ticket-onsite', text: `On arrival: “${scenario.complaint}”` })
        : null,
      h('p', { class: 'ticket-note', text: scenario.customerNote }),
      h(
        'div',
        { class: 'ticket-spec' },
        chip(`${spec.tons} ton`),
        chip(spec.refrigerant),
        chip(spec.metering === 'txv' ? 'TXV' : 'Fixed orifice'),
        chip(`${spec.efficiency} efficiency`),
        chip(`RLA ${spec.rla} A`),
      ),
    ),
  );

  // --- circuit diagram --------------------------------------------------------
  root.appendChild(
    h(
      'figure',
      { class: 'panel circuit-wrap' },
      renderCircuit(run),
      h('figcaption', {
        text: 'Readings appear on the diagram where they were taken.',
      }),
    ),
  );

  // --- measurements ------------------------------------------------------------
  const measure = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'Take a reading' }),
    h('p', {
      class: 'panel-note',
      text:
        'Each reading costs time. The skill is choosing the three or four that actually separate ' +
        'the candidates, not measuring everything in the van.',
    }),
  );

  for (const group of measurementGroups()) {
    measure.appendChild(h('h3', { class: 'measure-group', text: group.label }));
    const row = h('div', { class: 'measure-row' });
    for (const item of group.items) {
      const taken = run.taken.has(item.id);
      // No `available` set means Practice mode, where the van is imaginary and
      // complete. On a career call it is whatever you have actually bought.
      const owned = !ctx.available || ctx.available.has(item.id);
      const needs = owned ? undefined : toolForMeasurement(item.id);

      row.appendChild(
        h(
          'button',
          {
            class: `measure-btn ${taken ? 'measure-taken' : ''} ${owned ? '' : 'measure-locked'}`,
            disabled: taken || !owned,
            title: owned ? item.instrument : `Needs a ${needs?.name.toLowerCase() ?? 'tool'}`,
            onClick: () => ctx.onMeasure(item.id),
          },
          h('span', { class: 'measure-name', text: item.name }),
          h('span', {
            class: 'measure-cost',
            text: !owned ? 'no tool' : taken ? '✓' : `${item.minutes} min`,
          }),
        ),
      );
    }
    measure.appendChild(row);
  }
  root.appendChild(measure);

  // --- readings so far ----------------------------------------------------------
  if (run.readings.length > 0) {
    const panel = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Readings' }),
    );
    const list = h('div', { class: 'reading-list' });
    for (const reading of run.readings) {
      list.appendChild(
        h(
          'div',
          { class: 'reading' },
          h('span', { class: 'reading-label', text: reading.label }),
          h('span', { class: 'reading-value', text: reading.value }),
          reading.note ? h('span', { class: 'reading-note', text: reading.note }) : null,
        ),
      );
    }
    panel.appendChild(list);
    root.appendChild(panel);
  }

  // --- calculated values -----------------------------------------------------------
  const derived = run.derived();
  if (derived.length > 0) {
    const panel = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Calculated' }),
      h('p', {
        class: 'panel-note',
        text: 'These appear automatically once both of their inputs have been measured.',
      }),
    );
    const list = h('div', { class: 'derived-list' });
    for (const value of derived) {
      list.appendChild(
        h(
          'div',
          { class: `derived derived-${value.verdict}` },
          h('span', { class: 'derived-label', text: value.label }),
          h('span', { class: 'derived-value', text: value.value }),
          h('span', { class: 'derived-verdict', text: value.verdict.toUpperCase() }),
          h('span', { class: 'derived-target', text: value.target }),
        ),
      );
    }
    panel.appendChild(list);
    root.appendChild(panel);
  }

  // --- diagnosis --------------------------------------------------------------------
  const diagnose = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'Commit to a diagnosis' }),
    h('p', {
      class: 'panel-note',
      text: 'Getting it right without the evidence to back it scores as a guess, because that is what it is.',
    }),
  );

  const options = h('div', { class: 'choices' });
  for (const candidate of scenario.candidates) {
    const def = fault(candidate);
    options.appendChild(
      h(
        'button',
        { class: 'choice', onClick: () => ctx.onDiagnose(candidate) },
        h('span', { class: 'choice-text', text: def.name }),
      ),
    );
  }
  diagnose.appendChild(options);
  root.appendChild(diagnose);

  return root;
}

// ---------------------------------------------------------------------------
// Debrief
// ---------------------------------------------------------------------------

function renderDebrief(ctx: ServiceCallContext): HTMLElement {
  const outcome = ctx.run.result!;
  const { scenario } = ctx.run;

  const root = h('div', { class: 'results' });

  const gradeLabel = {
    clean: 'Clean call',
    correct: 'Correct',
    lucky: 'Lucky guess',
    wrong: 'Wrong diagnosis',
  }[outcome.grade];

  root.appendChild(
    h(
      'header',
      { class: 'results-head panel' },
      h('span', { class: 'results-mode', text: 'Service Call' }),
      h('h1', { class: 'results-score', text: outcome.points.toLocaleString() }),
      h('p', {
        class: `results-verdict ${outcome.correct ? 'verdict-pass' : 'verdict-fail'}`,
        text: gradeLabel,
      }),
      h('p', {
        class: 'results-line',
        text: `${outcome.minutesUsed} minutes on site · ${ctx.run.readings.length} readings taken`,
      }),
      h(
        'div',
        { class: 'results-actions' },
        h('button', {
          class: 'btn btn-primary',
          onClick: ctx.onReplay,
          text: ctx.replayLabel ?? 'Next call',
        }),
        ctx.replayLabel
          ? null
          : h('button', { class: 'btn btn-ghost', onClick: ctx.onHome, text: 'Back to menu' }),
      ),
      h('p', { class: 'results-seed', text: `Seed ${scenario.seed}` }),
    ),
  );

  // What it actually was.
  const actual = h(
    'section',
    { class: `panel reveal reveal-${outcome.correct ? 'ok' : 'bad'}` },
    h(
      'div',
      { class: 'reveal-head' },
      h('strong', { text: outcome.actualDef.name }),
      outcome.correct ? null : h('span', { class: 'reveal-points', text: `you said: ${outcome.chosenDef.name}` }),
    ),
    h('p', { class: 'signature', text: outcome.actualDef.signature }),
  );
  actual.appendChild(paragraphs(outcome.actualDef.explain, 'reveal-explain'));
  actual.appendChild(
    h(
      'p',
      { class: 'citation' },
      h('span', { class: 'citation-label', text: 'Repair' }),
      outcome.actualDef.repair,
    ),
  );
  root.appendChild(actual);

  // How the call was worked.
  if (outcome.notes.length > 0) {
    const notes = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'How you worked it' }),
    );
    for (const note of outcome.notes) notes.appendChild(h('p', { class: 'panel-note', text: note }));
    root.appendChild(notes);
  }

  // The readings, so the signature can be re-read after the fact.
  const readings = h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel-title', text: 'Your readings' }),
  );

  if (ctx.run.readings.length === 0) {
    readings.appendChild(h('p', { class: 'panel-note', text: 'You took no readings at all.' }));
  } else {
    const list = h('div', { class: 'reading-list' });
    for (const reading of ctx.run.readings) {
      const wasKey = outcome.actualDef.keyMeasurements.includes(reading.id);
      list.appendChild(
        h(
          'div',
          { class: `reading ${wasKey ? 'reading-key' : ''}` },
          h('span', { class: 'reading-label', text: reading.label }),
          h('span', { class: 'reading-value', text: reading.value }),
          wasKey ? h('span', { class: 'reading-note', text: 'key reading' }) : null,
        ),
      );
    }
    readings.appendChild(list);
  }

  if (outcome.keyMissed.length > 0) {
    readings.appendChild(
      h('h3', { class: 'measure-group', text: 'What you did not check' }),
    );
    const missed = h('div', { class: 'reading-list' });
    for (const id of outcome.keyMissed) {
      const def = measurementDef(id);
      missed.appendChild(
        h(
          'div',
          { class: 'reading reading-missed' },
          h('span', { class: 'reading-label', text: def.name }),
          h('span', { class: 'reading-note', text: def.location }),
        ),
      );
    }
    readings.appendChild(missed);
  }
  root.appendChild(readings);

  // Contrast with what it is confused with.
  if (outcome.actualDef.confusedWith.length > 0) {
    const contrast = h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'panel-title', text: 'Easily confused with' }),
    );
    for (const other of outcome.actualDef.confusedWith) {
      const def = fault(other);
      contrast.appendChild(
        h(
          'div',
          { class: 'contrast' },
          h('span', { class: 'contrast-name', text: def.name }),
          h('span', { class: 'contrast-signature', text: def.signature }),
        ),
      );
    }
    root.appendChild(contrast);
  }

  return root;
}

function chip(text: string): HTMLElement {
  return h('span', { class: 'chip', text });
}
