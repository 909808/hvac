import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { grade } from '../src/engine/grade';
import { formatReport, validateContent } from '../src/engine/validate';
import { BOOKS, HVAC, TRACKS } from '../src/content';
import { generateDrill, generateMixedDrill, type DrillLabId } from '../src/games/hvac/drills';
import { generateServiceCall, ServiceCallRun } from '../src/games/hvac/servicecall';
import { FAULTS, type FaultId } from '../src/games/hvac/system';
import {
  enthalpy,
  humidityRatioFromRh,
  saturationPressure,
  sensibleHeat,
  stateFromDryBulbWetBulb,
  totalHeat,
  waterHeat,
} from '../src/games/hvac/psychrometrics';
import { fanLaws, judgeDeltaT, totalExternalStatic } from '../src/games/hvac/airflow';
import { sectorProgress, unlockedLabs } from '../src/engine/progression';
import { emptyProfile, recordCheckpoint } from '../src/engine/profile';

const LABS: DrillLabId[] = [
  'pt-chart',
  'superheat-subcooling',
  'psychrometrics',
  'heat-load',
  'airflow',
  'electrical',
];

describe('generated drills', () => {
  it('produce structurally valid questions across many seeds', () => {
    for (const lab of LABS) {
      for (let seed = 1; seed <= 30; seed++) {
        const questions = generateDrill(lab, createRng(seed), 12);
        const report = validateContent({ tracks: TRACKS, books: BOOKS, questions });
        if (!report.ok) throw new Error(`${lab} seed ${seed}:\n${formatReport(report)}`);
      }
    }
  });

  it('produce a valid mixed drill', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const questions = generateMixedDrill(createRng(seed), 20);
      const report = validateContent({ tracks: TRACKS, books: BOOKS, questions });
      if (!report.ok) throw new Error(`mixed seed ${seed}:\n${formatReport(report)}`);
    }
  });

  it('are reproducible from a seed', () => {
    const a = generateMixedDrill(createRng(777), 15);
    const b = generateMixedDrill(createRng(777), 15);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  /**
   * The important one: a numeric drill must accept its own stated answer. If a
   * generator computes one number and explains a different one, the drill
   * teaches the wrong value while marking you wrong for getting it right.
   */
  it('accept their own answer', () => {
    for (const lab of LABS) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const q of generateDrill(lab, createRng(seed), 12)) {
          if (q.kind !== 'input') continue;
          const stated = q.accept[0]!;
          const judgement = grade(q, { kind: 'input', text: stated });
          expect(judgement.correct, `${q.id} rejects its own answer "${stated}"`).toBe(true);
        }
      }
    }
  });

  it('reject an answer well outside the tolerance', () => {
    for (const lab of LABS) {
      for (let seed = 1; seed <= 20; seed++) {
        for (const q of generateDrill(lab, createRng(seed), 10)) {
          if (q.kind !== 'input' || q.tolerance === undefined) continue;
          const expected = Number(q.accept[0]);
          if (!Number.isFinite(expected)) continue;
          const wayOff = String(expected + q.tolerance * 10 + 100);
          expect(
            grade(q, { kind: 'input', text: wayOff }).correct,
            `${q.id} accepted ${wayOff} for an answer of ${expected}`,
          ).toBe(false);
        }
      }
    }
  });

  it('file every generated question under a real objective', () => {
    const objectives = new Set(
      HVAC.domains.flatMap((d) => d.objectives.map((o) => `${d.id}/${o.id}`)),
    );
    for (const lab of LABS) {
      for (const q of generateDrill(lab, createRng(5), 12)) {
        expect(objectives.has(`${q.domain}/${q.objective}`), `${q.id}`).toBe(true);
      }
    }
  });
});

describe('numeric input grading', () => {
  const q = {
    id: 'hvac.1.1.x',
    track: 'hvac',
    domain: '1.0',
    objective: '1.1',
    kind: 'input',
    difficulty: 1,
    prompt: 'p',
    accept: ['12000'],
    tolerance: 10,
    explain: 'a sufficiently long explanation for the validator',
    source: { kind: 'generated', generator: 'test' },
    status: 'verified',
  } as const;

  it('accepts the exact answer', () => {
    expect(grade(q, { kind: 'input', text: '12000' }).correct).toBe(true);
  });

  it('accepts within tolerance', () => {
    expect(grade(q, { kind: 'input', text: '12005' }).correct).toBe(true);
    expect(grade(q, { kind: 'input', text: '11995' }).correct).toBe(true);
  });

  it('rejects outside tolerance', () => {
    expect(grade(q, { kind: 'input', text: '12500' }).correct).toBe(false);
  });

  it('tolerates thousands separators and trailing units', () => {
    expect(grade(q, { kind: 'input', text: '12,000' }).correct).toBe(true);
    expect(grade(q, { kind: 'input', text: '12000 BTU/h' }).correct).toBe(true);
    expect(grade(q, { kind: 'input', text: ' 12,000 btu ' }).correct).toBe(true);
  });

  it('rejects text that contains no number', () => {
    expect(grade(q, { kind: 'input', text: 'twelve thousand' }).correct).toBe(false);
  });
});

describe('psychrometrics', () => {
  it('matches published chart values at 80°F DB / 67°F WB', () => {
    const s = stateFromDryBulbWetBulb(80, 67);
    expect(s.relativeHumidity).toBeCloseTo(51, 0);
    expect(s.enthalpy).toBeCloseTo(31.4, 0);
    expect(s.dewPointF).toBeCloseTo(60.3, 0);
    expect(s.specificVolume).toBeCloseTo(13.85, 1);
  });

  it('matches published chart values at 75°F DB / 50% RH', () => {
    const w = humidityRatioFromRh(75, 50);
    const s = stateFromDryBulbWetBulb(75, 62.55);
    expect(s.relativeHumidity).toBeCloseTo(50, 0);
    expect(w * 7000).toBeCloseTo(64.6, 0);
  });

  it('collapses dry bulb, wet bulb and dew point at saturation', () => {
    const s = stateFromDryBulbWetBulb(70, 70);
    expect(s.relativeHumidity).toBeCloseTo(100, 0);
    expect(s.dewPointF).toBeCloseTo(70, 0);
  });

  it('never lets wet bulb or dew point exceed dry bulb', () => {
    for (let db = 40; db <= 100; db += 5) {
      for (let rh = 10; rh <= 100; rh += 10) {
        const w = humidityRatioFromRh(db, rh);
        const s = stateFromDryBulbWetBulb(db, db);
        expect(s.wetBulbF).toBeLessThanOrEqual(db + 0.01);
        expect(s.dewPointF).toBeLessThanOrEqual(db + 0.01);
        void w;
      }
    }
  });

  it('rises monotonically in saturation pressure with temperature', () => {
    for (let t = 20; t < 200; t += 5) {
      expect(saturationPressure(t + 5)).toBeGreaterThan(saturationPressure(t));
    }
  });

  it('splits total heat into sensible and latent', () => {
    // 1,000 CFM, 20°F drop, 6 Btu/lb enthalpy drop.
    const qs = sensibleHeat(1000, 20);
    const qt = totalHeat(1000, 6);
    expect(qs).toBe(21600);
    expect(qt).toBe(27000);
    expect(qt).toBeGreaterThan(qs);
  });

  it('computes hydronic heat', () => {
    expect(waterHeat(10, 20)).toBe(100000);
  });

  it('computes enthalpy consistently with its two terms', () => {
    const w = humidityRatioFromRh(75, 50);
    expect(enthalpy(75, w)).toBeCloseTo(0.24 * 75 + w * (1061 + 0.444 * 75), 6);
  });
});

describe('airflow', () => {
  it('sums static pressure magnitudes rather than signed values', () => {
    expect(totalExternalStatic(0.42, -0.38)).toBeCloseTo(0.8, 2);
    expect(totalExternalStatic(-0.42, 0.38)).toBeCloseTo(0.8, 2);
  });

  it('applies the fan laws at the right powers', () => {
    expect(fanLaws.cfm(1000, 800, 1600)).toBe(2000);
    expect(fanLaws.staticPressure(0.5, 800, 1600)).toBeCloseTo(2.0, 2);
    expect(fanLaws.horsepower(0.5, 800, 1600)).toBeCloseTo(4.0, 2);
  });

  it('expects a smaller temperature drop in humid air', () => {
    const humid = judgeDeltaT(18, 72);
    const dry = judgeDeltaT(18, 58);
    expect(humid.expectedMax).toBeLessThan(dry.expectedMin + 6);
    expect(humid.verdict).toBe('normal');
    expect(dry.verdict).toBe('low');
  });
});

describe('service call', () => {
  it('generates a scenario whose candidates include the real fault', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const call = generateServiceCall(createRng(seed));
      expect(call.candidates, `seed ${seed}`).toContain(call.actualFault);
      expect(call.candidates.length).toBeGreaterThanOrEqual(3);
      expect(new Set(call.candidates).size).toBe(call.candidates.length);
    }
  });

  it('keeps wet bulb below dry bulb in every generated scenario', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const call = generateServiceCall(createRng(seed));
      expect(call.conditions.returnWetBulbF).toBeLessThan(call.conditions.returnDryBulbF);
    }
  });

  it('scores a well-evidenced correct diagnosis higher than an unevidenced one', () => {
    const call = generateServiceCall(createRng(42), 1);
    const def = FAULTS.find((f) => f.id === call.actualFault)!;

    const evidenced = new ServiceCallRun(call);
    for (const m of def.keyMeasurements) evidenced.measure(m);
    const good = evidenced.diagnose(call.actualFault);

    const guessed = new ServiceCallRun(call);
    const lucky = guessed.diagnose(call.actualFault);

    expect(good.correct).toBe(true);
    expect(lucky.correct).toBe(true);
    expect(good.points).toBeGreaterThan(lucky.points);
    expect(lucky.grade).toBe('lucky');
  });

  it('scores a wrong diagnosis at zero', () => {
    const call = generateServiceCall(createRng(7), 1);
    const wrong = call.candidates.find((c) => c !== call.actualFault)!;
    const run = new ServiceCallRun(call);
    const outcome = run.diagnose(wrong);
    expect(outcome.correct).toBe(false);
    expect(outcome.points).toBe(0);
  });

  it('charges time for each measurement and never double-charges', () => {
    const call = generateServiceCall(createRng(11));
    const run = new ServiceCallRun(call);
    run.measure('suction-pressure');
    const after = run.minutesUsed;
    run.measure('suction-pressure');
    expect(run.minutesUsed).toBe(after);
    expect(after).toBeGreaterThan(0);
  });

  it('reveals derived values only once their inputs are measured', () => {
    const call = generateServiceCall(createRng(13));
    const run = new ServiceCallRun(call);
    expect(run.derived()).toHaveLength(0);
    run.measure('suction-pressure');
    expect(run.derived()).toHaveLength(0);
    run.measure('suction-line-temp');
    expect(run.derived().map((d) => d.id)).toContain('superheat');
  });

  it('is idempotent once diagnosed', () => {
    const call = generateServiceCall(createRng(3), 1);
    const run = new ServiceCallRun(call);
    const first = run.diagnose(call.actualFault);
    const second = run.diagnose(call.candidates.find((c) => c !== call.actualFault)!);
    expect(second).toBe(first);
  });

  it('offers every fault as a real scenario at some seed', () => {
    const seen = new Set<FaultId>();
    for (let seed = 1; seed <= 400; seed++) {
      seen.add(generateServiceCall(createRng(seed)).actualFault);
    }
    for (const f of FAULTS) {
      expect(seen.has(f.id), `fault ${f.id} never generated`).toBe(true);
    }
  });
});

describe('sector progression', () => {
  const questions = [...HVAC.domains].flatMap((d) =>
    Array.from({ length: 12 }, (_, i) => ({
      id: `hvac.${d.id}.q${i}`,
      track: 'hvac' as const,
      domain: d.id,
      objective: d.objectives[0]!.id,
      kind: 'choice' as const,
      difficulty: 1 as const,
      prompt: 'p',
      choices: ['a', 'b'],
      answer: 0,
      explain: 'a sufficiently long explanation for the validator',
      source: { kind: 'generated' as const, generator: 'test' },
      status: 'verified' as const,
    })),
  );

  it('opens only the first sector for a new profile', () => {
    const progress = sectorProgress(HVAC, emptyProfile(), questions);
    expect(progress[0]?.status).toBe('open');
    expect(progress[1]?.status).toBe('locked');
    expect(progress[1]?.lockedBy).toBe(progress[0]?.sector.title);
  });

  it('unlocks the next sector when a checkpoint is passed', () => {
    const profile = recordCheckpoint(emptyProfile(), '1.0', 90, 75, Date.now());
    const progress = sectorProgress(HVAC, profile, questions);
    expect(progress[0]?.status).toBe('passed');
    expect(progress[1]?.status).toBe('open');
    expect(progress[2]?.status).toBe('locked');
  });

  it('does not unlock on a failing score', () => {
    const profile = recordCheckpoint(emptyProfile(), '1.0', 60, 75, Date.now());
    const progress = sectorProgress(HVAC, profile, questions);
    expect(progress[0]?.status).toBe('open');
    expect(progress[1]?.status).toBe('locked');
  });

  it('keeps a sector passed after a later weaker attempt', () => {
    let profile = recordCheckpoint(emptyProfile(), '1.0', 95, 75, Date.now());
    profile = recordCheckpoint(profile, '1.0', 40, 75, Date.now());
    expect(profile.checkpoints['1.0']?.passed).toBe(true);
    expect(profile.checkpoints['1.0']?.bestPercent).toBe(95);
    expect(profile.checkpoints['1.0']?.attempts).toBe(2);
  });

  it('does not let an empty sector block the ones after it', () => {
    const withoutSector2 = questions.filter((q) => q.domain !== '2.0');
    const progress = sectorProgress(HVAC, emptyProfile(), withoutSector2);
    const sector3 = progress.find((p) => p.sector.id === '3.0');
    expect(sector3?.status).toBe('open');
  });

  it('unlocks labs as sectors open', () => {
    const fresh = unlockedLabs(HVAC, emptyProfile(), questions);
    expect(fresh.has('service-call')).toBe(false);

    let profile = emptyProfile();
    for (const id of ['1.0', '2.0', '3.0']) {
      profile = recordCheckpoint(profile, id, 100, 75, Date.now());
    }
    const later = unlockedLabs(HVAC, profile, questions);
    expect(later.has('service-call')).toBe(true);
    expect(later.has('superheat-subcooling')).toBe(true);
  });
});
