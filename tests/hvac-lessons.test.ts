import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, ALL_QUESTIONS, HVAC, auditContent } from '../src/content';
import { lessonMinutes, lessonsFor, validateLessons } from '../src/engine/lesson';
import { formatReport } from '../src/engine/validate';
import { grade } from '../src/engine/grade';
import type { Lesson } from '../src/engine/lesson';

const domainsByTrack = new Map([
  ['hvac', new Set(HVAC.domains.map((d) => d.id))],
]);

describe('lessons', () => {
  it('pass validation as part of the combined audit', () => {
    const report = auditContent();
    if (!report.ok) throw new Error(`\n${formatReport(report)}`);
    expect(report.errors).toHaveLength(0);
  });

  it('produce no warnings', () => {
    const report = auditContent();
    if (report.warnings.length > 0) throw new Error(`\n${formatReport(report)}`);
    expect(report.warnings).toHaveLength(0);
  });

  it('cover every HVAC sector', () => {
    for (const sector of HVAC.sectors ?? []) {
      const lessons = lessonsFor(ALL_LESSONS, 'hvac', sector.id);
      expect(lessons.length, `sector ${sector.id} (${sector.title}) has no lesson`).toBeGreaterThan(0);
    }
  });

  it('gives every lesson a unique id', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('orders lessons within a sector without gaps or ties', () => {
    for (const sector of HVAC.sectors ?? []) {
      const lessons = lessonsFor(ALL_LESSONS, 'hvac', sector.id);
      const orders = lessons.map((l) => l.order);
      expect(new Set(orders).size, `sector ${sector.id} has duplicate order values`).toBe(
        orders.length,
      );
    }
  });

  it('gives every sector a sensible reading time', () => {
    for (const sector of HVAC.sectors ?? []) {
      const minutes = lessonMinutes(lessonsFor(ALL_LESSONS, 'hvac', sector.id));
      expect(minutes, `sector ${sector.id}`).toBeGreaterThan(0);
      expect(minutes, `sector ${sector.id} claims ${minutes} min — too long for one sitting`).toBeLessThan(40);
    }
  });

  it('includes teaching prose, not just reference blocks', () => {
    for (const lesson of ALL_LESSONS) {
      const hasProse = lesson.sections.some((s) => s.kind === 'prose');
      expect(hasProse, `${lesson.id} has no prose section`).toBe(true);
    }
  });

  it('gives every worked example an answer and at least two steps', () => {
    for (const lesson of ALL_LESSONS) {
      for (const section of lesson.sections) {
        if (section.kind !== 'worked') continue;
        expect(section.steps.length, `${lesson.id}: ${section.heading}`).toBeGreaterThanOrEqual(2);
        expect(section.answer.trim().length, `${lesson.id}: ${section.heading}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps table rows the same width as their header', () => {
    for (const lesson of ALL_LESSONS) {
      for (const section of lesson.sections) {
        if (section.kind !== 'table') continue;
        for (const [i, row] of section.rows.entries()) {
          expect(row.length, `${lesson.id}: ${section.heading} row ${i + 1}`).toBe(
            section.columns.length,
          );
        }
      }
    }
  });

  it('never marks an uncited lesson as verified', () => {
    const offenders = ALL_LESSONS.filter(
      (l) => l.status === 'verified' && l.source.kind === 'uncited',
    );
    expect(offenders.map((l) => l.id)).toEqual([]);
  });
});

describe('lesson validator', () => {
  const good: Lesson = {
    id: 'hvac.lesson.test',
    track: 'hvac',
    domain: '1.0',
    order: 1,
    title: 'Test',
    summary: 'A summary',
    minutes: 5,
    sections: [{ kind: 'prose', body: 'Some teaching prose.' }],
    source: { kind: 'standard', ref: 'Test' },
    status: 'verified',
  };

  const check = (lesson: unknown) => validateLessons([lesson as Lesson], domainsByTrack);

  it('accepts a well-formed lesson', () => {
    expect(check(good).filter((i) => i.level === 'error')).toHaveLength(0);
  });

  it('catches a domain that does not exist', () => {
    const issues = check({ ...good, domain: '99.0' });
    expect(issues.some((i) => i.message.includes('does not exist'))).toBe(true);
  });

  it('catches a lesson with no sections', () => {
    const issues = check({ ...good, sections: [] });
    expect(issues.some((i) => i.message.includes('no sections'))).toBe(true);
  });

  it('catches a verified lesson with no citation', () => {
    const issues = check({ ...good, source: { kind: 'uncited', note: 'todo' } });
    expect(issues.some((i) => i.message.includes('no citation'))).toBe(true);
  });

  it('catches a table row that does not match its columns', () => {
    const issues = check({
      ...good,
      sections: [
        { kind: 'prose', body: 'x' },
        { kind: 'table', heading: 'T', columns: ['a', 'b'], rows: [['1']] },
      ],
    });
    expect(issues.some((i) => i.message.includes('cells for'))).toBe(true);
  });

  it('catches a diagram link pointing at a missing node', () => {
    const issues = check({
      ...good,
      sections: [
        { kind: 'prose', body: 'x' },
        {
          kind: 'diagram',
          topology: {
            nodes: [{ id: 'a', kind: 'pc', label: 'A', col: 0, row: 0 }],
            links: [{ from: 'a', to: 'ghost' }],
          },
        },
      ],
    });
    expect(issues.some((i) => i.message.includes('unknown node'))).toBe(true);
  });

  it('catches a duplicate lesson id', () => {
    const issues = validateLessons([good, good], domainsByTrack);
    expect(issues.some((i) => i.message.includes('duplicate lesson id'))).toBe(true);
  });

  it('warns about a lesson with no prose', () => {
    const issues = check({
      ...good,
      sections: [{ kind: 'keyNumbers', heading: 'K', items: [{ label: 'a', value: 'b' }] }],
    });
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('no prose'))).toBe(true);
  });
});

describe('hotspot questions', () => {
  const hotspots = ALL_QUESTIONS.filter((q) => q.kind === 'hotspot');

  it('exist in the bank', () => {
    expect(hotspots.length).toBeGreaterThan(0);
  });

  it('point their answer at a node that exists on the diagram', () => {
    for (const q of hotspots) {
      if (q.kind !== 'hotspot') continue;
      const ids = new Set(q.topology.nodes.map((n) => n.id));
      expect(ids.has(q.answer), `${q.id} answers "${q.answer}"`).toBe(true);
    }
  });

  it('grade a correct pick as correct and a wrong one as wrong', () => {
    for (const q of hotspots) {
      if (q.kind !== 'hotspot') continue;
      expect(grade(q, { kind: 'hotspot', nodeId: q.answer }).correct, q.id).toBe(true);

      const other = q.topology.nodes.find((n) => n.id !== q.answer);
      if (other) {
        expect(grade(q, { kind: 'hotspot', nodeId: other.id }).correct, q.id).toBe(false);
      }
    }
  });

  it('offer at least three clickable nodes, so it is not a coin flip', () => {
    for (const q of hotspots) {
      if (q.kind !== 'hotspot') continue;
      expect(q.topology.nodes.length, q.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('explains most wrong picks', () => {
    for (const q of hotspots) {
      if (q.kind !== 'hotspot') continue;
      const wrongNodes = q.topology.nodes.filter((n) => n.id !== q.answer).length;
      const explained = Object.keys(q.whyWrong ?? {}).length;
      expect(explained, `${q.id} explains ${explained} of ${wrongNodes} wrong picks`).toBeGreaterThanOrEqual(
        Math.min(2, wrongNodes),
      );
    }
  });
});

describe('content volume', () => {
  it('gives every HVAC sector enough questions to be worth studying', () => {
    const hvac = ALL_QUESTIONS.filter((q) => q.track === 'hvac');
    for (const sector of HVAC.sectors ?? []) {
      const count = hvac.filter((q) => q.domain === sector.id).length;
      expect(count, `sector ${sector.id} (${sector.title}) has only ${count} questions`).toBeGreaterThanOrEqual(14);
    }
  });

  it('uses a spread of question kinds rather than all multiple choice', () => {
    const hvac = ALL_QUESTIONS.filter((q) => q.track === 'hvac');
    const kinds = new Set(hvac.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
  });

  it('has more than twice the questions it started with', () => {
    const hvac = ALL_QUESTIONS.filter((q) => q.track === 'hvac');
    expect(hvac.length).toBeGreaterThan(180);
  });
});
