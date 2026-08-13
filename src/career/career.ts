import { createRng, randomSeed } from '@engine/rng';
import { generateBoard, jobAvailability, jobMinutes, JOB_TEMPLATES } from './jobs';
import { STARTING_TOOLS, tool, toolsMissingFor } from './tools';
import type {
  CareerEvent,
  CareerState,
  Job,
  JobSector,
  JobTemplate,
  RankId,
  ToolId,
} from './types';
import { MINUTES_PER_DAY } from './types';
import { earnedRank, meetsRank, openDistricts, rank } from './world';

/**
 * The career state machine.
 *
 * Everything here is a pure function from one `CareerState` to the next. The UI
 * holds the current state, calls one of these, and renders what comes back —
 * which keeps the interesting rules (what a job pays, what a mistake costs, when
 * a rank is earned) in one file that can be tested without a browser.
 *
 * The economy is deliberately tight at the bottom. A student clears about sixty
 * dollars an afternoon and a manifold set costs three hundred and twenty, so the
 * first gauge purchase is a real decision rather than a formality. It loosens as
 * you rank up, because by then the interesting constraint is knowledge, not cash.
 */

const STARTING_MONEY = 250;
const BOARD_SIZE = 7;
const LOG_LIMIT = 60;

export function newCareer(seed: number = randomSeed()): CareerState {
  return {
    started: false,
    seed,
    day: 1,
    minutesLeft: MINUTES_PER_DAY,
    money: STARTING_MONEY,
    earned: 0,
    reputation: 0,
    rank: 'student',
    tools: STARTING_TOOLS,
    jobsCompleted: 0,
    jobsFailed: 0,
    sectorReputation: {},
    board: [],
    log: [],
  };
}

/** First day on the books. */
export function startCareer(
  state: CareerState,
  passedSectors: ReadonlySet<string> = new Set(),
): CareerState {
  if (state.started) return state;
  const started: CareerState = {
    ...state,
    started: true,
    log: [
      event(
        1,
        'note',
        'Enrolled at the trade school. Hand tools, two hundred and fifty dollars, no idea what a superheat is.',
      ),
    ],
  };
  return refreshBoard(started, passedSectors);
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

/**
 * Regenerate the board for the current day. Deterministic in the career seed.
 *
 * `passedSectors` is passed through so the generator can guarantee there is
 * work you can actually do; a board you cannot touch is a bug, not a challenge.
 */
export function refreshBoard(
  state: CareerState,
  passedSectors: ReadonlySet<string> = new Set(),
): CareerState {
  const rng = createRng((state.seed + state.day * 7919) >>> 0);
  return {
    ...state,
    board: generateBoard({
      rng,
      day: state.day,
      reputation: state.reputation,
      rank: state.rank,
      openDistricts: openDistricts(state.reputation).map((d) => d.id),
      count: BOARD_SIZE,
      takeable: (template) => canTake(state, template, passedSectors),
    }),
  };
}

/**
 * Repost the board if a loaded save came back without one.
 *
 * A board can arrive empty for two very different reasons: you worked every job
 * on it, or the save lost its entries (a content update removed a template, a
 * partial write). The first is a legitimate end-of-day state and must not hand
 * out free work; the second leaves the career unplayable. An untouched day
 * tells them apart, since you cannot have cleared a board without spending time.
 */
export function ensureBoard(
  state: CareerState,
  passedSectors: ReadonlySet<string> = new Set(),
): CareerState {
  if (!state.started) return state;
  if (state.board.length > 0) return state;
  if (state.minutesLeft < MINUTES_PER_DAY) return state;
  return refreshBoard(state, passedSectors);
}

/** Every gate except the clock — the board is drawn before the day is spent. */
function canTake(
  state: CareerState,
  template: JobTemplate,
  passedSectors: ReadonlySet<string>,
): boolean {
  return (
    meetsRank(template.requiresRank, state.rank) &&
    state.reputation >= template.requiresReputation &&
    template.requiresSectors.every((s) => passedSectors.has(s)) &&
    toolsMissingFor(template.requiresTools, state.tools).length === 0
  );
}

/** Whether there is enough of the day left to take this on. */
export function fitsInDay(state: CareerState, job: Job): boolean {
  return jobMinutes(job) <= state.minutesLeft;
}

export interface JobReadiness {
  readonly ready: boolean;
  readonly blockers: readonly string[];
}

/**
 * Everything standing between you and this job, in one list.
 *
 * The time blocker is separate from the availability ones because it is the only
 * blocker that clears by itself — everything else is something you go and do.
 */
export function jobReadiness(
  state: CareerState,
  job: Job,
  passedSectors: ReadonlySet<string>,
  sectorTitles: ReadonlyMap<string, string>,
): JobReadiness {
  const availability = jobAvailability(
    job.template,
    passedSectors,
    state.tools,
    state.rank,
    state.reputation,
    sectorTitles,
  );
  const blockers = [...availability.blockers];
  if (!fitsInDay(state, job)) {
    blockers.push(`Needs ${jobMinutes(job)} min — ${state.minutesLeft} left today`);
  }
  return { ready: blockers.length === 0, blockers };
}

// ---------------------------------------------------------------------------
// Working a job
// ---------------------------------------------------------------------------

export type JobGrade = 'clean' | 'correct' | 'lucky' | 'wrong' | 'walked';

export interface JobResult {
  readonly grade: JobGrade;
  /** Total minutes spent, travel included. Defaults to the job's nominal cost. */
  readonly minutesUsed?: number;
  /** One line for the day log. */
  readonly summary: string;
}

interface GradeEffect {
  readonly payFactor: number;
  readonly repFactor: number;
  readonly counts: boolean;
  readonly label: string;
}

/**
 * What each outcome is worth.
 *
 * A `lucky` call still pays — the customer got a working system and does not
 * know how you got there — but it earns almost no reputation, because
 * reputation is other technicians and property managers talking about whether
 * you know what you are doing. That gap is the whole argument for studying.
 */
const GRADES: Record<JobGrade, GradeEffect> = {
  clean: { payFactor: 1.15, repFactor: 1, counts: true, label: 'Clean' },
  correct: { payFactor: 1, repFactor: 0.7, counts: true, label: 'Sorted' },
  lucky: { payFactor: 0.8, repFactor: 0.2, counts: true, label: 'Fixed, eventually' },
  wrong: { payFactor: 0.3, repFactor: -0.5, counts: false, label: 'Callback' },
  walked: { payFactor: 0, repFactor: -0.15, counts: false, label: 'Walked away' },
};

export function gradeLabel(grade: JobGrade): string {
  return GRADES[grade].label;
}

/**
 * Turn a quiz score into a job outcome.
 *
 * The bands are generous at the bottom on purpose: getting half of it right on
 * site usually means the work got done and the customer is not delighted, which
 * is `lucky`, not a callback. Below half you genuinely did not know what you
 * were looking at.
 */
export function gradeFromQuiz(percent: number): JobGrade {
  if (percent >= 90) return 'clean';
  if (percent >= 70) return 'correct';
  if (percent >= 50) return 'lucky';
  return 'wrong';
}

/**
 * Map minutes spent inside the Service Call simulator onto minutes of the
 * working day.
 *
 * The simulator budgets about 25 minutes of instrument time; a real call is an
 * hour and a half. So the template's on-site time is the baseline and the
 * simulator moves it by ±30% — being efficient with the gauges buys you another
 * call before dark, which is a more honest reward than points.
 */
export function siteMinutes(job: Job, simMinutes: number, budget = 25): number {
  const ratio = budget === 0 ? 1 : simMinutes / budget;
  const factor = Math.min(1.3, Math.max(0.7, 0.7 + 0.6 * ratio));
  const travel = jobMinutes(job) - job.template.minutes;
  return Math.round(travel + job.template.minutes * factor);
}

/**
 * Settle a finished job: money, reputation, time, rank.
 *
 * `passedSectors` comes in because rank is recomputed here — finishing the job
 * that takes you over the line should promote you in the same beat, not on some
 * later screen.
 */
export function settleJob(
  state: CareerState,
  job: Job,
  result: JobResult,
  passedSectors: ReadonlySet<string>,
): CareerState {
  const effect = GRADES[result.grade];
  const minutes = result.minutesUsed ?? jobMinutes(job);
  const cut = rank(state.rank).cut;

  const gross = Math.round(job.pay * effect.payFactor);
  const take = Math.round(gross * cut);

  const baseRep = job.template.reputation;
  const repDelta =
    effect.repFactor >= 0
      ? Math.round(baseRep * effect.repFactor)
      : -Math.max(1, Math.round(baseRep * -effect.repFactor));

  const reputation = Math.max(0, state.reputation + repDelta);
  const sector = job.template.sector;
  const sectorRep = Math.max(0, (state.sectorReputation[sector] ?? 0) + repDelta);

  const settled: CareerState = {
    ...state,
    minutesLeft: Math.max(0, state.minutesLeft - minutes),
    money: state.money + take,
    earned: state.earned + take,
    reputation,
    sectorReputation: { ...state.sectorReputation, [sector]: sectorRep },
    jobsCompleted: state.jobsCompleted + (effect.counts ? 1 : 0),
    jobsFailed: state.jobsFailed + (effect.counts ? 0 : 1),
    // The job leaves the board whatever happened. You do not get to re-run a
    // call you botched.
    board: state.board.filter((j) => j.uid !== job.uid),
    log: pushEvent(
      state.log,
      event(state.day, 'job', `${job.client} — ${result.summary}`, take === 0 ? undefined : take),
    ),
  };

  return syncRank(settled, passedSectors);
}

/** Leave a job on the board and lose nothing but the drive out. */
export function abandonJob(state: CareerState, job: Job): CareerState {
  return settleJob(
    state,
    job,
    {
      grade: 'walked',
      minutesUsed: jobMinutes(job) - job.template.minutes,
      summary: 'Turned it down after looking it over.',
    },
    new Set(),
  );
}

// ---------------------------------------------------------------------------
// Rank
// ---------------------------------------------------------------------------

/** Recompute rank from knowledge and experience, logging any promotion. */
export function syncRank(state: CareerState, passedSectors: ReadonlySet<string>): CareerState {
  const should = earnedRank(passedSectors, state.jobsCompleted, state.earned);
  if (should === state.rank) return state;

  const promoted = rank(should);
  return {
    ...state,
    rank: should,
    log: pushEvent(
      state.log,
      event(state.day, 'rank', `Made ${promoted.title}. ${promoted.blurb}`),
    ),
  };
}

// ---------------------------------------------------------------------------
// The shop
// ---------------------------------------------------------------------------

export interface PurchaseResult {
  readonly state: CareerState;
  readonly bought: boolean;
  readonly reason?: string;
}

export function buyTool(state: CareerState, id: ToolId): PurchaseResult {
  if (state.tools.includes(id)) {
    return { state, bought: false, reason: 'Already in the van.' };
  }
  const item = tool(id);
  if (state.money < item.cost) {
    return { state, bought: false, reason: `Short by $${item.cost - state.money}.` };
  }

  return {
    state: {
      ...state,
      money: state.money - item.cost,
      tools: [...state.tools, id],
      log: pushEvent(state.log, event(state.day, 'purchase', `Bought: ${item.name}.`, -item.cost)),
    },
    bought: true,
  };
}

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

/**
 * Daily overhead: fuel, truck stock, insurance.
 *
 * Nothing while you are being driven around by somebody else. It starts once
 * the van is yours, and scales with rank so it stays a background pressure
 * rather than a wall.
 */
export function dailyOverhead(rankId: RankId): number {
  switch (rankId) {
    case 'student':
      return 0;
    case 'apprentice':
      return 0;
    case 'technician':
      return 25;
    case 'lead':
      return 45;
    case 'owner':
      return 80;
  }
}

export interface DaySummary {
  readonly day: number;
  readonly earnedToday: number;
  readonly jobsToday: number;
  readonly overhead: number;
  /** Every dollar that moved today, purchases and overhead included. */
  readonly netToday: number;
}

/** Close the day out: pay overhead, roll the date, put up a fresh board. */
export function endDay(
  state: CareerState,
  passedSectors: ReadonlySet<string> = new Set(),
): { state: CareerState; summary: DaySummary } {
  const today = state.log.filter((e) => e.day === state.day);
  const earnedToday = today
    .filter((e) => e.kind === 'job')
    .reduce((sum, e) => sum + Math.max(0, e.money ?? 0), 0);
  const jobsToday = today.filter((e) => e.kind === 'job').length;
  const overhead = dailyOverhead(state.rank);
  // Money in from work, minus tools bought and the day's running costs. A day
  // that reads "+$7" after a $120 purchase would be a lie.
  const netToday = today.reduce((sum, e) => sum + (e.money ?? 0), 0) - overhead;

  const rolled: CareerState = {
    ...state,
    day: state.day + 1,
    minutesLeft: MINUTES_PER_DAY,
    // Overhead can put you in the red. That is a bad week, not a game over —
    // there is always routine work on the board to dig out with.
    money: state.money - overhead,
    log: pushEvent(
      state.log,
      event(
        state.day,
        'day',
        overhead > 0
          ? `Day ${state.day} done. ${jobsToday} job${jobsToday === 1 ? '' : 's'}, $${earnedToday} in. Fuel and stock: $${overhead}.`
          : `Day ${state.day} done. ${jobsToday} job${jobsToday === 1 ? '' : 's'}, $${earnedToday} in.`,
        overhead > 0 ? -overhead : undefined,
      ),
    ),
  };

  return {
    state: refreshBoard(rolled, passedSectors),
    summary: { day: state.day, earnedToday, jobsToday, overhead, netToday },
  };
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/** Reputation by sector, highest first — where you have made your name. */
export function specialisms(state: CareerState): { sector: JobSector; reputation: number }[] {
  return Object.entries(state.sectorReputation)
    .map(([sector, reputation]) => ({ sector: sector as JobSector, reputation }))
    .filter((s) => s.reputation > 0)
    .sort((a, b) => b.reputation - a.reputation);
}

/** Events from a given day, oldest first, for the day-summary card. */
export function eventsOn(state: CareerState, day: number): CareerEvent[] {
  return state.log.filter((e) => e.day === day).reverse();
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Career state with job templates flattened to ids.
 *
 * The board holds template objects for convenience at runtime, but persisting
 * them would freeze a copy of the content into every save file — so a save
 * stores ids and rehydrates against the current templates on load.
 */
export interface CareerSave extends Omit<CareerState, 'board'> {
  readonly board: readonly {
    readonly uid: string;
    readonly templateId: string;
    readonly district: Job['district'];
    readonly client: string;
    readonly pay: number;
    readonly postedOn: number;
  }[];
}

export function serialiseCareer(state: CareerState): CareerSave {
  return {
    ...state,
    board: state.board.map((j) => ({
      uid: j.uid,
      templateId: j.template.id,
      district: j.district,
      client: j.client,
      pay: j.pay,
      postedOn: j.postedOn,
    })),
  };
}

export function deserialiseCareer(save: CareerSave | undefined): CareerState {
  if (!save) return newCareer();

  const templates = new Map<string, JobTemplate>(JOB_TEMPLATES.map((t) => [t.id, t]));
  const base = newCareer(save.seed);

  const board: Job[] = [];
  for (const entry of save.board ?? []) {
    const template = templates.get(entry.templateId);
    // A template removed by a content update simply drops off the board.
    if (!template) continue;
    board.push({
      uid: entry.uid,
      template,
      district: entry.district,
      client: entry.client,
      pay: entry.pay,
      postedOn: entry.postedOn,
    });
  }

  return {
    ...base,
    started: save.started ?? false,
    day: save.day ?? 1,
    minutesLeft: save.minutesLeft ?? MINUTES_PER_DAY,
    money: save.money ?? STARTING_MONEY,
    earned: save.earned ?? 0,
    reputation: save.reputation ?? 0,
    rank: save.rank ?? 'student',
    tools: save.tools ?? STARTING_TOOLS,
    jobsCompleted: save.jobsCompleted ?? 0,
    jobsFailed: save.jobsFailed ?? 0,
    sectorReputation: save.sectorReputation ?? {},
    board,
    log: save.log ?? [],
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function event(
  day: number,
  kind: CareerEvent['kind'],
  text: string,
  money?: number,
): CareerEvent {
  return money === undefined ? { day, kind, text } : { day, kind, text, money };
}

function pushEvent(log: readonly CareerEvent[], entry: CareerEvent): CareerEvent[] {
  return [entry, ...log].slice(0, LOG_LIMIT);
}
