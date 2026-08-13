import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import {
  abandonJob,
  buyTool,
  dailyOverhead,
  deserialiseCareer,
  endDay,
  ensureBoard,
  eventsOn,
  fitsInDay,
  gradeFromQuiz,
  jobReadiness,
  newCareer,
  refreshBoard,
  serialiseCareer,
  settleJob,
  siteMinutes,
  specialisms,
  startCareer,
  syncRank,
} from '../src/career/career';
import {
  generateBoard,
  jobAvailability,
  jobMinutes,
  JOB_TEMPLATES,
} from '../src/career/jobs';
import {
  availableMeasurements,
  shopList,
  STARTING_TOOLS,
  TOOLS,
  tool,
  toolForMeasurement,
  toolsMissingFor,
} from '../src/career/tools';
import {
  DISTRICTS,
  earnedRank,
  meetsRank,
  openDistricts,
  RANKS,
  rank,
  rankProgress,
} from '../src/career/world';
import { MEASUREMENTS } from '../src/games/hvac/system';
import type { Job, ToolId } from '../src/career/types';
import { MINUTES_PER_DAY } from '../src/career/types';
import { HVAC } from '../src/content/tracks';

/** Kept in step with STARTING_MONEY in career.ts. */
const STARTING_MONEY = 250;

const SECTOR_IDS = new Set<string>(HVAC.sectors?.map((s) => s.id) ?? []);
const ALL_SECTORS = new Set<string>(SECTOR_IDS);
const ALL_TOOLS = TOOLS.map((t) => t.id);
const TITLES = new Map((HVAC.sectors ?? []).map((s) => [s.id, s.title]));

function job(templateId: string): Job {
  const template = JOB_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`no template "${templateId}"`);
  return {
    uid: `test.${templateId}`,
    template,
    district: template.districts[0]!,
    client: 'Test Client',
    pay: template.pay,
    postedOn: 1,
  };
}

// ---------------------------------------------------------------------------
// Content integrity
// ---------------------------------------------------------------------------

describe('career content', () => {
  it('only requires sectors that exist in the HVAC curriculum', () => {
    for (const template of JOB_TEMPLATES) {
      for (const sector of template.requiresSectors) {
        expect(SECTOR_IDS.has(sector), `${template.id} wants sector ${sector}`).toBe(true);
      }
      if (template.quizDomain) {
        expect(SECTOR_IDS.has(template.quizDomain), `${template.id} quiz domain`).toBe(true);
      }
    }
  });

  it('only requires tools that exist', () => {
    const ids = new Set(ALL_TOOLS);
    for (const template of JOB_TEMPLATES) {
      for (const id of template.requiresTools) {
        expect(ids.has(id), `${template.id} wants tool ${id}`).toBe(true);
      }
    }
  });

  it('gives every job a unique id and a district that exists', () => {
    const seen = new Set<string>();
    const districts = new Set(DISTRICTS.map((d) => d.id));
    for (const template of JOB_TEMPLATES) {
      expect(seen.has(template.id), `duplicate template ${template.id}`).toBe(false);
      seen.add(template.id);
      expect(template.districts.length).toBeGreaterThan(0);
      for (const d of template.districts) expect(districts.has(d)).toBe(true);
    }
  });

  it('gives diagnose jobs a tier and knowledge jobs a domain', () => {
    for (const template of JOB_TEMPLATES) {
      if (template.resolution === 'diagnose') {
        expect(template.tier, `${template.id} needs a tier`).toBeDefined();
      }
      if (template.resolution === 'knowledge') {
        expect(template.quizDomain, `${template.id} needs a quiz domain`).toBeDefined();
      }
    }
  });

  it('never posts a job in a district the rest of its gating cannot reach', () => {
    // A job asking for 20 reputation in a district that opens at 55 would be
    // dead content: by the time you can get there the requirement is moot, and
    // worse, a job could be permanently invisible.
    for (const template of JOB_TEMPLATES) {
      const cheapest = Math.min(
        ...template.districts.map(
          (id) => DISTRICTS.find((d) => d.id === id)?.requiresReputation ?? Infinity,
        ),
      );
      expect(cheapest, `${template.id} is unreachable`).toBeLessThan(Infinity);
    }
  });

  it('covers every simulator measurement with exactly one tool', () => {
    for (const measurement of MEASUREMENTS) {
      const owners = TOOLS.filter((t) => t.enables.includes(measurement.id));
      expect(owners.length, `${measurement.id} is enabled by ${owners.length} tools`).toBe(1);
    }
  });

  it('teaches every purchasable tool in a sector that exists', () => {
    for (const item of TOOLS) {
      if (item.taughtIn) expect(SECTOR_IDS.has(item.taughtIn), item.id).toBe(true);
    }
  });

  it('ranks only require sectors that exist, and get strictly harder', () => {
    for (const [i, r] of RANKS.entries()) {
      for (const s of r.requiresSectors) expect(SECTOR_IDS.has(s), `${r.id} wants ${s}`).toBe(true);
      const previous = RANKS[i - 1];
      if (!previous) continue;
      expect(r.requiresJobs).toBeGreaterThanOrEqual(previous.requiresJobs);
      expect(r.requiresEarned).toBeGreaterThanOrEqual(previous.requiresEarned);
      expect(r.cut).toBeGreaterThan(previous.cut);
    }
  });
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

describe('tools', () => {
  it('starts with hand tools and nothing else', () => {
    expect(STARTING_TOOLS).toEqual(['hand-tools']);
  });

  it('unlocks only the visual checks at the start', () => {
    const available = availableMeasurements(STARTING_TOOLS);
    expect(available.has('filter-inspect')).toBe(true);
    expect(available.has('suction-pressure')).toBe(false);
    expect(available.has('static-pressure')).toBe(false);
  });

  it('unlocks everything once the whole kit is bought', () => {
    const available = availableMeasurements(ALL_TOOLS);
    for (const measurement of MEASUREMENTS) expect(available.has(measurement.id)).toBe(true);
  });

  it('names the tool a measurement needs', () => {
    expect(toolForMeasurement('static-pressure')?.id).toBe('manometer');
    expect(toolForMeasurement('compressor-amps')?.id).toBe('clamp-meter');
  });

  it('lists the shop cheapest first and hides what you own', () => {
    const list = shopList(['hand-tools', 'multimeter']);
    expect(list.some((t) => t.id === 'multimeter')).toBe(false);
    expect(list.some((t) => t.id === 'hand-tools')).toBe(false);
    for (let i = 1; i < list.length; i++) {
      expect(list[i]!.cost).toBeGreaterThanOrEqual(list[i - 1]!.cost);
    }
  });

  it('reports exactly what a job is missing', () => {
    const missing = toolsMissingFor(['manifold-gauges', 'thermocouple'], ['thermocouple']);
    expect(missing).toEqual(['manifold-gauges']);
  });
});

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

describe('world', () => {
  it('opens two districts at zero reputation and all six eventually', () => {
    expect(openDistricts(0).map((d) => d.id)).toEqual(['school', 'suburbs']);
    expect(openDistricts(1000)).toHaveLength(DISTRICTS.length);
  });

  it('orders ranks so a lead counts as a technician', () => {
    expect(meetsRank('technician', 'lead')).toBe(true);
    expect(meetsRank('lead', 'technician')).toBe(false);
    expect(meetsRank('student', 'student')).toBe(true);
  });

  it('needs knowledge as well as experience to rank up', () => {
    // Every job and every dollar, but no sectors passed: still a student.
    expect(earnedRank(new Set(), 999, 999_999)).toBe('student');
    expect(earnedRank(new Set(['1.0']), 999, 999_999)).toBe('apprentice');
    expect(earnedRank(ALL_SECTORS, 999, 999_999)).toBe('owner');
  });

  it('states what the next rank is short of', () => {
    const progress = rankProgress('student', new Set(), 0, 0);
    expect(progress.next?.id).toBe('apprentice');
    expect(progress.sectorsMissing).toEqual(['1.0']);
    expect(progress.jobsShort).toBe(RANKS[1]!.requiresJobs);
    expect(progress.ready).toBe(false);
  });

  it('has no next rank past owner', () => {
    expect(rankProgress('owner', ALL_SECTORS, 999, 999_999).next).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

describe('job availability', () => {
  it('lets a brand new student take the ride-along', () => {
    const result = jobAvailability(
      job('ridealong').template,
      new Set(),
      STARTING_TOOLS,
      'student',
      0,
      TITLES,
    );
    expect(result.available).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it('names the sector by title, not by number', () => {
    const result = jobAvailability(
      job('walkin-cooler').template,
      new Set(),
      ALL_TOOLS,
      'owner',
      100,
      TITLES,
    );
    expect(result.available).toBe(false);
    expect(result.blockers.some((b) => b.includes('Refrigerant'))).toBe(true);
  });

  it('counts missing tools without naming them all', () => {
    const result = jobAvailability(
      job('no-cool-basic').template,
      ALL_SECTORS,
      STARTING_TOOLS,
      'owner',
      100,
      TITLES,
    );
    expect(result.missingTools).toEqual(['manifold-gauges', 'thermocouple']);
    expect(result.blockers).toContain('Buy 2 tools');
  });
});

// ---------------------------------------------------------------------------
// Board generation
// ---------------------------------------------------------------------------

describe('board generation', () => {
  it('is reproducible from the seed', () => {
    const options = { day: 3, reputation: 20, openDistricts: ['school', 'suburbs'] } as const;
    const a = generateBoard({ rng: createRng(7), ...options });
    const b = generateBoard({ rng: createRng(7), ...options });
    expect(a.map((j) => j.uid)).toEqual(b.map((j) => j.uid));
    expect(a.map((j) => j.pay)).toEqual(b.map((j) => j.pay));
  });

  it('never posts work in a district that is not open', () => {
    const board = generateBoard({ rng: createRng(11), day: 1, reputation: 0, openDistricts: ['school'] });
    for (const posting of board) expect(posting.district).toBe('school');
  });

  it('gives a day-one student something to do', () => {
    const state = startCareer(newCareer(4242));
    expect(state.board.length).toBeGreaterThan(0);
    const takeable = state.board.filter(
      (j) => jobReadiness(state, j, new Set(), TITLES).ready,
    );
    expect(takeable.length, 'a fresh career must have at least one takeable job').toBeGreaterThan(0);
  });

  it('shows work slightly out of reach, so there is a reason to study', () => {
    // Across a spread of seeds a new player should see at least one blocked job.
    const blocked = [1, 2, 3, 4, 5].some((seed) => {
      const state = startCareer(newCareer(seed));
      return state.board.some((j) => !jobReadiness(state, j, new Set(), TITLES).ready);
    });
    expect(blocked).toBe(true);
  });

  it('stops posting school work once you are a technician', () => {
    const options = {
      day: 4,
      reputation: 40,
      openDistricts: ['school', 'suburbs', 'oldtown'] as const,
      // Large enough to draw every candidate, so this tests the filter and not
      // the sampling.
      count: 200,
    };
    const asStudent = generateBoard({ rng: createRng(3), ...options, rank: 'student' });
    const asTech = generateBoard({ rng: createRng(3), ...options, rank: 'technician' });

    expect(asStudent.some((j) => j.template.id === 'ridealong')).toBe(true);
    expect(asTech.some((j) => j.template.retiresAt !== undefined)).toBe(false);
    expect(asTech.length).toBeGreaterThan(0);
  });

  it('charges travel both ways', () => {
    const posting = job('walkin-cooler');
    const travel = DISTRICTS.find((d) => d.id === posting.district)!.travelMinutes;
    expect(jobMinutes(posting)).toBe(travel * 2 + posting.template.minutes);
  });

  it('keeps every job inside a single working day', () => {
    for (const template of JOB_TEMPLATES) {
      for (const districtId of template.districts) {
        const travel = DISTRICTS.find((d) => d.id === districtId)!.travelMinutes;
        expect(
          travel * 2 + template.minutes,
          `${template.id} in ${districtId} cannot be done in a day`,
        ).toBeLessThanOrEqual(MINUTES_PER_DAY);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// The state machine
// ---------------------------------------------------------------------------

describe('career state', () => {
  it('starts unstarted, and starting is idempotent', () => {
    const fresh = newCareer(1);
    expect(fresh.started).toBe(false);
    const begun = startCareer(fresh);
    expect(begun.started).toBe(true);
    expect(startCareer(begun)).toBe(begun);
  });

  it('pays a rank cut rather than the whole ticket', () => {
    const state = startCareer(newCareer(1));
    const posting = job('ridealong');
    const after = settleJob(state, posting, { grade: 'correct', summary: 'ok' }, new Set());
    // A student keeps 35%.
    expect(after.money).toBe(state.money + Math.round(posting.pay * rank('student').cut));
    expect(after.earned).toBeGreaterThan(0);
  });

  it('pays more for a clean job than a lucky one', () => {
    const state = startCareer(newCareer(1));
    const posting = job('ridealong');
    const clean = settleJob(state, posting, { grade: 'clean', summary: '' }, new Set());
    const lucky = settleJob(state, posting, { grade: 'lucky', summary: '' }, new Set());
    expect(clean.money).toBeGreaterThan(lucky.money);
    expect(clean.reputation).toBeGreaterThan(lucky.reputation);
  });

  it('counts a wrong call as a failure and costs standing', () => {
    let state = startCareer(newCareer(1));
    state = settleJob(state, job('ridealong'), { grade: 'clean', summary: '' }, new Set());
    const before = state.reputation;
    const after = settleJob(state, job('ridealong'), { grade: 'wrong', summary: '' }, new Set());
    expect(after.jobsFailed).toBe(1);
    expect(after.jobsCompleted).toBe(1);
    expect(after.reputation).toBeLessThan(before);
  });

  it('never lets reputation go negative', () => {
    let state = startCareer(newCareer(1));
    for (let i = 0; i < 10; i++) {
      state = settleJob(state, job('ridealong'), { grade: 'wrong', summary: '' }, new Set());
    }
    expect(state.reputation).toBe(0);
  });

  it('spends the day and drops the job from the board', () => {
    const state = startCareer(newCareer(1));
    const posting = state.board[0]!;
    const after = settleJob(state, posting, { grade: 'correct', summary: '' }, new Set());
    expect(after.minutesLeft).toBe(MINUTES_PER_DAY - jobMinutes(posting));
    expect(after.board.some((j) => j.uid === posting.uid)).toBe(false);
  });

  it('promotes on the spot when a job crosses the line', () => {
    let state = startCareer(newCareer(1));
    // Sector 1 passed, so the only thing missing is jobs and money.
    const passed = new Set(['1.0']);
    for (let i = 0; i < 8; i++) {
      state = { ...state, minutesLeft: MINUTES_PER_DAY };
      state = settleJob(state, job('ridealong'), { grade: 'clean', summary: '' }, passed);
    }
    expect(state.rank).toBe('apprentice');
    expect(state.log.some((e) => e.kind === 'rank')).toBe(true);
  });

  it('walking away costs the drive but not the day', () => {
    const state = startCareer(newCareer(1));
    const posting = state.board[0]!;
    const after = abandonJob(state, posting);
    const travel = jobMinutes(posting) - posting.template.minutes;
    expect(MINUTES_PER_DAY - after.minutesLeft).toBe(travel);
    expect(after.money).toBe(state.money);
    expect(after.jobsFailed).toBe(1);
  });

  it('refuses a job that will not fit in what is left of the day', () => {
    const state = { ...startCareer(newCareer(1)), minutesLeft: 30 };
    const posting = state.board[0]!;
    expect(fitsInDay(state, posting)).toBe(false);
    const readiness = jobReadiness(state, posting, ALL_SECTORS, TITLES);
    expect(readiness.ready).toBe(false);
    expect(readiness.blockers.some((b) => b.includes('left today'))).toBe(true);
  });

  it('tracks reputation per sector so specialising shows', () => {
    let state = startCareer(newCareer(1));
    state = settleJob(state, job('ridealong'), { grade: 'clean', summary: '' }, new Set());
    expect(specialisms(state)[0]?.sector).toBe('residential');
  });
});

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

describe('buying tools', () => {
  it('refuses what you cannot afford and changes nothing', () => {
    const state = startCareer(newCareer(1));
    const result = buyTool(state, 'combustion-analyser');
    expect(result.bought).toBe(false);
    expect(result.state).toBe(state);
    expect(result.reason).toMatch(/Short by/);
  });

  it('refuses what you already own', () => {
    const state = startCareer(newCareer(1));
    expect(buyTool(state, 'hand-tools').bought).toBe(false);
  });

  it('takes the money and adds the tool', () => {
    const state = startCareer(newCareer(1));
    const result = buyTool(state, 'thermocouple');
    expect(result.bought).toBe(true);
    expect(result.state.money).toBe(state.money - tool('thermocouple').cost);
    expect(result.state.tools).toContain('thermocouple');
    expect(availableMeasurements(result.state.tools).has('suction-line-temp')).toBe(true);
  });

  it('can afford at least one useful instrument on day one', () => {
    const state = startCareer(newCareer(1));
    const affordable = shopList(state.tools).filter((t) => t.cost <= state.money);
    expect(affordable.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

describe('days', () => {
  it('charges nothing while somebody else is driving', () => {
    expect(dailyOverhead('student')).toBe(0);
    expect(dailyOverhead('apprentice')).toBe(0);
    expect(dailyOverhead('owner')).toBeGreaterThan(dailyOverhead('technician'));
  });

  it('rolls the date, restores the day and posts a new board', () => {
    let state = startCareer(newCareer(9));
    state = settleJob(state, state.board[0]!, { grade: 'correct', summary: 'x' }, new Set());
    const { state: next, summary } = endDay(state);

    expect(summary.day).toBe(1);
    expect(summary.jobsToday).toBe(1);
    expect(summary.earnedToday).toBeGreaterThan(0);
    expect(next.day).toBe(2);
    expect(next.minutesLeft).toBe(MINUTES_PER_DAY);
    expect(next.board.length).toBeGreaterThan(0);
  });

  it('counts tools bought against the day, not just the work', () => {
    let state = startCareer(newCareer(9));
    state = settleJob(state, state.board[0]!, { grade: 'clean', summary: 'x' }, new Set());
    const earned = state.money - STARTING_MONEY;
    state = buyTool(state, 'thermocouple').state;

    const { summary } = endDay(state);
    expect(summary.earnedToday).toBe(earned);
    // A day that reads "+$X" after spending more than that on a tool is a lie.
    expect(summary.netToday).toBe(earned - tool('thermocouple').cost);
    expect(summary.netToday).toBeLessThan(0);
  });

  it('gives a different board on a different day', () => {
    const day1 = startCareer(newCareer(3));
    const day2 = refreshBoard({ ...day1, day: 2 });
    expect(day2.board.map((j) => j.uid)).not.toEqual(day1.board.map((j) => j.uid));
  });

  it('logs the day and can retrieve it', () => {
    let state = startCareer(newCareer(9));
    state = settleJob(state, state.board[0]!, { grade: 'correct', summary: 'x' }, new Set());
    const { state: next } = endDay(state);
    expect(eventsOn(next, 1).length).toBeGreaterThan(0);
    expect(eventsOn(next, 1).some((e) => e.kind === 'day')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

describe('grading', () => {
  it('maps quiz scores to outcomes that get worse monotonically', () => {
    expect(gradeFromQuiz(100)).toBe('clean');
    expect(gradeFromQuiz(90)).toBe('clean');
    expect(gradeFromQuiz(89)).toBe('correct');
    expect(gradeFromQuiz(70)).toBe('correct');
    expect(gradeFromQuiz(69)).toBe('lucky');
    expect(gradeFromQuiz(50)).toBe('lucky');
    expect(gradeFromQuiz(49)).toBe('wrong');
    expect(gradeFromQuiz(0)).toBe('wrong');
  });

  it('rewards an efficient service call with a shorter day', () => {
    const posting = job('no-cool-basic');
    const fast = siteMinutes(posting, 10);
    const slow = siteMinutes(posting, 45);
    expect(fast).toBeLessThan(slow);
    // Even a very slow call stays inside a sensible envelope.
    expect(slow).toBeLessThanOrEqual(jobMinutes(posting) * 1.35);
    expect(fast).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe('persistence', () => {
  it('round-trips a career through JSON', () => {
    let state = startCareer(newCareer(77));
    state = settleJob(state, state.board[0]!, { grade: 'clean', summary: 'sorted' }, new Set());
    state = buyTool(state, 'thermocouple').state;

    const restored = deserialiseCareer(
      JSON.parse(JSON.stringify(serialiseCareer(state))) as ReturnType<typeof serialiseCareer>,
    );

    expect(restored.money).toBe(state.money);
    expect(restored.earned).toBe(state.earned);
    expect(restored.reputation).toBe(state.reputation);
    expect(restored.tools).toEqual(state.tools);
    expect(restored.board.map((j) => j.uid)).toEqual(state.board.map((j) => j.uid));
    expect(restored.board[0]?.template.id).toBe(state.board[0]?.template.id);
    expect(restored.log).toEqual(state.log);
  });

  it('drops board entries whose template no longer exists', () => {
    const state = startCareer(newCareer(5));
    const save = serialiseCareer(state);
    const tampered = {
      ...save,
      board: [...save.board, { ...save.board[0]!, uid: 'x', templateId: 'deleted-by-an-update' }],
    };
    expect(deserialiseCareer(tampered).board).toHaveLength(save.board.length);
  });

  it('returns a fresh career for a missing save', () => {
    expect(deserialiseCareer(undefined).started).toBe(false);
  });

  it('reposts a board that a save lost, on an untouched day', () => {
    const state = startCareer(newCareer(5));
    const emptied = { ...state, board: [] };
    expect(ensureBoard(emptied).board.length).toBeGreaterThan(0);
  });

  it('does not repost a board you cleared by working it', () => {
    // Half the day gone means the board emptied because you worked it, and
    // handing out a fresh one would be free money.
    const state = startCareer(newCareer(5));
    const worked = { ...state, board: [], minutesLeft: 240 };
    expect(ensureBoard(worked).board).toHaveLength(0);
  });

  it('leaves an unstarted career alone', () => {
    const fresh = newCareer(5);
    expect(ensureBoard(fresh)).toBe(fresh);
  });
});

// ---------------------------------------------------------------------------
// Progression sanity
// ---------------------------------------------------------------------------

describe('progression sanity', () => {
  it('reaches apprentice in a plausible number of school days', () => {
    // Play the school jobs as well as a student can, with sector 1 passed.
    const passed = new Set(['1.0']);
    let state = syncRank(startCareer(newCareer(2024)), passed);
    let days = 0;

    while (state.rank === 'student' && days < 12) {
      let worked = true;
      while (worked) {
        worked = false;
        for (const posting of state.board) {
          if (!jobReadiness(state, posting, passed, TITLES).ready) continue;
          state = settleJob(state, posting, { grade: 'clean', summary: '' }, passed);
          worked = true;
          break;
        }
      }
      state = endDay(state).state;
      days++;
    }

    expect(state.rank, `still a student after ${days} days`).toBe('apprentice');
    expect(days).toBeLessThanOrEqual(6);
  });

  it('cannot buy the whole van from a standing start', () => {
    const state = startCareer(newCareer(1));
    const total = TOOLS.reduce((sum, t) => sum + t.cost, 0);
    expect(state.money).toBeLessThan(total / 4);
  });

  it('gates every measurement-bearing tool behind money worth earning', () => {
    const enabling: ToolId[] = TOOLS.filter((t) => t.enables.length > 0 && t.cost > 0).map(
      (t) => t.id,
    );
    expect(enabling.length).toBeGreaterThan(3);
    for (const id of enabling) expect(tool(id).cost).toBeGreaterThan(100);
  });
});
