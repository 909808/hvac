import { createRng, randomSeed } from '@engine/rng';
import {
  clearProfile,
  emptyProfile,
  loadProfile,
  recordCheckpoint,
  recordReview,
  recordRun,
  saveProfile,
  type Profile,
} from '@engine/profile';
import { Session } from '@engine/session';
import type { FaultId, MeasurementId } from '@games/hvac/system';
import { ServiceCallRun, generateServiceCall } from '@games/hvac/servicecall';
import type { Response, Track } from '@engine/types';
import { lessonsFor } from '@engine/lesson';
import { currentSector } from '@engine/progression';
import { ALL_LESSONS, ALL_QUESTIONS, TRACKS, trackById } from '@content/index';
import {
  abandonJob,
  buyTool,
  endDay,
  ensureBoard,
  gradeFromQuiz,
  refreshBoard,
  settleJob,
  siteMinutes,
  startCareer,
  syncRank,
  eventsOn,
  type DaySummary,
  type JobResult,
} from '@career/career';
import { availableMeasurements } from '@career/tools';
import { loadCareer, saveCareer } from '@career/storage';
import type { CareerState, DistrictId, Job, ToolId } from '@career/types';
import { rank } from '@career/world';
import { clear, h } from './dom';
import { buildJobQuiz, buildMixedDrill, buildSession, type ModeId } from './modes';
import { renderHome } from './screens/home';
import { renderPlay, resetDraft } from './screens/play';
import { renderResults } from './screens/results';
import { renderAudit, renderProgress } from './screens/reports';
import { renderSectorMap } from './screens/sectormap';
import { renderServiceCall } from './screens/servicecall';
import { renderLesson, resetLessonState } from './screens/lesson';
import { renderCareer } from './screens/career';
import { renderDaySummary, renderLogbook, renderVan } from './screens/van';
import { renderJobDebrief, type JobPayoff } from './screens/jobdebrief';

type Screen =
  | { name: 'home' }
  | { name: 'play' }
  | { name: 'results'; previousBest: number }
  | { name: 'progress' }
  | { name: 'audit' }
  | { name: 'service-call' }
  | { name: 'lesson'; sectorId: string; index: number }
  // --- career ---------------------------------------------------------------
  | { name: 'career' }
  | { name: 'career-van' }
  | { name: 'career-log' }
  | { name: 'career-job' }
  | { name: 'career-debrief'; payoff: JobPayoff }
  | { name: 'career-day'; summary: DaySummary };

const TRACK_KEY = 'netplus-trainer:track';
const HVAC_TRACK = 'hvac';

/**
 * Application shell.
 *
 * Deliberately a plain class with a full re-render on each state change. The app
 * is small, the DOM is small, and the alternative — incremental updates — would
 * buy nothing but bugs at this size.
 */
export class App {
  private readonly root: HTMLElement;
  private profile: Profile;
  private track: Track;
  private screen: Screen = { name: 'home' };

  private session: Session | undefined;
  private call: ServiceCallRun | undefined;
  private mode: ModeId = 'drill';
  private domain: string | undefined;
  private seed = randomSeed();
  private shuffleSeed = randomSeed();
  private timer: number | undefined;
  /** Which sector row is open on the path. Undefined means "the current one". */
  private expandedSector: string | undefined;

  // --- career ---------------------------------------------------------------
  private career: CareerState;
  private activeJob: Job | undefined;
  private selectedDistrict: DistrictId | undefined;
  private vanNotice: string | undefined;

  constructor(root: HTMLElement) {
    this.root = root;
    this.profile = loadProfile();
    this.career = ensureBoard(loadCareer(), this.passedSectors());

    const savedTrack = safeGet(TRACK_KEY);
    this.track = (savedTrack ? trackById(savedTrack) : undefined) ?? TRACKS[0]!;

    window.addEventListener('keydown', this.onKeydown);
    this.render();
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  private render = (): void => {
    clear(this.root);

    switch (this.screen.name) {
      case 'home':
        this.stopTimer();
        // A track with sectors gets the guided path; one without gets the flat
        // mode grid. Network+ domains are independent, HVAC's are not.
        this.root.appendChild(
          this.track.sectors && this.track.sectors.length > 0
            ? renderSectorMap({
                track: this.track,
                tracks: TRACKS,
                pool: ALL_QUESTIONS,
                lessons: ALL_LESSONS,
                profile: this.profile,
                expanded: this.expandedSector,
                onToggleSector: this.toggleSector,
                onStartLesson: this.startLesson,
                onStartDrill: (sectorId) => this.start('drill', sectorId),
                onStartCheckpoint: (sectorId) => this.start('checkpoint', sectorId),
                onStartLab: (mode) =>
                  mode === 'service-call' ? this.startServiceCall() : this.start(mode),
                onStartMixed: this.startMixed,
                onStartWeak: () => this.start('weak'),
                onSelectTrack: this.selectTrack,
                onShowProgress: () => this.goto({ name: 'progress' }),
                onShowAudit: () => this.goto({ name: 'audit' }),
                ...(this.track.id === HVAC_TRACK
                  ? { onOpenCareer: () => this.goto({ name: 'career' }), career: this.career }
                  : {}),
              })
            : renderHome({
                track: this.track,
                tracks: TRACKS,
                pool: ALL_QUESTIONS,
                profile: this.profile,
                onStart: this.start,
                onSelectTrack: this.selectTrack,
                onShowProgress: () => this.goto({ name: 'progress' }),
                onShowAudit: () => this.goto({ name: 'audit' }),
              }),
        );
        break;

      case 'lesson': {
        const screen = this.screen;
        const lessons = lessonsFor(ALL_LESSONS, this.track.id, screen.sectorId);
        if (lessons.length === 0) return this.goto({ name: 'home' });

        const sector = this.track.sectors?.find((s) => s.id === screen.sectorId);
        this.root.appendChild(
          renderLesson({
            lessons,
            index: Math.min(screen.index, lessons.length - 1),
            sectorTitle: sector?.title ?? screen.sectorId,
            onNavigate: (index) =>
              this.goto({ name: 'lesson', sectorId: screen.sectorId, index }),
            onStartQuestions: () => this.start('drill', screen.sectorId),
            onHome: () => this.goto({ name: 'home' }),
          }),
        );
        break;
      }

      case 'service-call': {
        if (!this.call) return this.goto({ name: 'home' });
        this.root.appendChild(
          renderServiceCall({
            run: this.call,
            onMeasure: this.measure,
            onDiagnose: this.diagnose,
            onReplay: this.startServiceCall,
            onHome: () => this.goto({ name: 'home' }),
          }),
        );
        break;
      }

      // --- career -----------------------------------------------------------
      case 'career': {
        this.stopTimer();
        this.root.appendChild(
          renderCareer({
            state: this.career,
            passedSectors: this.passedSectors(),
            sectorTitles: this.sectorTitles(),
            selectedDistrict: this.selectedDistrict,
            onSelectDistrict: (id) => {
              this.selectedDistrict = id;
              this.render();
            },
            onStartJob: this.startJob,
            onOpenVan: () => this.goto({ name: 'career-van' }),
            onOpenLog: () => this.goto({ name: 'career-log' }),
            onEndDay: this.endWorkingDay,
            onStudy: this.studySector,
            onBegin: this.beginCareer,
          }),
        );
        break;
      }

      case 'career-van': {
        this.root.appendChild(
          renderVan({
            state: this.career,
            sectorTitles: this.sectorTitles(),
            passedSectors: this.passedSectors(),
            notice: this.vanNotice,
            onBuy: this.buy,
            onBack: () => this.goto({ name: 'career' }),
          }),
        );
        // The notice is a response to the last click, not a persistent banner.
        this.vanNotice = undefined;
        break;
      }

      case 'career-log': {
        this.root.appendChild(
          renderLogbook({
            state: this.career,
            passedSectors: this.passedSectors(),
            sectorTitles: this.sectorTitles(),
            onBack: () => this.goto({ name: 'career' }),
          }),
        );
        break;
      }

      case 'career-job': {
        const job = this.activeJob;
        if (!job) return this.goto({ name: 'career' });

        if (this.call) {
          this.root.appendChild(
            renderServiceCall({
              run: this.call,
              available: availableMeasurements(this.career.tools),
              headline: job.template.title,
              bookedComplaint: job.template.complaint,
              replayLabel: 'Write up the ticket',
              leaveLabel: 'Walk away',
              onMeasure: this.measure,
              onDiagnose: this.diagnoseOnJob,
              onReplay: this.finishJobCall,
              onHome: this.walkAway,
            }),
          );
        } else if (this.session) {
          this.root.appendChild(
            renderPlay({
              session: this.session,
              mode: this.mode,
              headline: `${job.template.title} · ${job.client}`,
              shuffleSeed: this.shuffleSeed,
              onAnswer: this.answer,
              onNext: this.next,
              onSkip: this.skip,
              onQuit: this.finishRun,
              rerender: this.render,
            }),
          );
        } else {
          return this.goto({ name: 'career' });
        }
        break;
      }

      case 'career-debrief': {
        this.root.appendChild(
          renderJobDebrief({
            payoff: this.screen.payoff,
            state: this.career,
            onStudy: this.studySector,
            onBack: () => this.goto({ name: 'career' }),
          }),
        );
        break;
      }

      case 'career-day': {
        this.root.appendChild(
          renderDaySummary({
            summary: this.screen.summary,
            state: this.career,
            events: eventsOn(this.career, this.screen.summary.day),
            onContinue: () => this.goto({ name: 'career' }),
          }),
        );
        break;
      }

      case 'play': {
        if (!this.session) return this.goto({ name: 'home' });
        this.root.appendChild(
          renderPlay({
            session: this.session,
            mode: this.mode,
            shuffleSeed: this.shuffleSeed,
            onAnswer: this.answer,
            onNext: this.next,
            onSkip: this.skip,
            onQuit: this.finishRun,
            rerender: this.render,
          }),
        );
        break;
      }

      case 'results': {
        if (!this.session) return this.goto({ name: 'home' });
        this.stopTimer();
        this.root.appendChild(
          renderResults({
            snapshot: this.session.snapshot(),
            mode: this.mode,
            seed: this.seed,
            previousBest: this.screen.previousBest,
            onReplay: () => this.start(this.mode, this.domain),
            onHome: () => this.goto({ name: 'home' }),
          }),
        );
        break;
      }

      case 'progress':
      case 'audit': {
        const context = {
          track: this.track,
          pool: ALL_QUESTIONS,
          profile: this.profile,
          onHome: () => this.goto({ name: 'home' }),
          onReset: this.resetProgress,
        };
        this.root.appendChild(
          this.screen.name === 'progress' ? renderProgress(context) : renderAudit(context),
        );
        break;
      }
    }
  };

  private goto(screen: Screen): void {
    this.screen = screen;
    this.render();
  }

  // -------------------------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------------------------

  /** Clicking the open row closes it, so the path can be collapsed entirely. */
  private toggleSector = (sectorId: string): void => {
    const current = currentSector(this.track, this.profile, ALL_QUESTIONS);
    const openNow = this.expandedSector ?? current?.sector.id;
    this.expandedSector = openNow === sectorId ? '' : sectorId;
    this.render();
  };

  private startLesson = (sectorId: string): void => {
    resetLessonState();
    this.stopTimer();
    this.goto({ name: 'lesson', sectorId, index: 0 });
    window.scrollTo({ top: 0 });
  };

  /** A service call runs its own screen and state machine, not a question session. */
  private startServiceCall = (): void => {
    this.mode = 'service-call';
    this.seed = randomSeed();
    this.call = new ServiceCallRun(generateServiceCall(createRng(this.seed)));
    this.goto({ name: 'service-call' });
  };

  private measure = (id: MeasurementId): void => {
    this.call?.measure(id);
    this.render();
  };

  private diagnose = (id: FaultId): void => {
    if (!this.call) return;
    const outcome = this.call.diagnose(id);

    this.profile = recordRun(
      this.profile,
      {
        mode: 'service-call',
        track: this.track.id,
        at: Date.now(),
        score: outcome.points,
        asked: 1,
        correct: outcome.correct ? 1 : 0,
      },
      0,
    );
    saveProfile(this.profile);
    this.render();
  };

  // -------------------------------------------------------------------------
  // Career
  // -------------------------------------------------------------------------

  /** Sectors of the HVAC track whose checkpoint has been passed. */
  private passedSectors(): Set<string> {
    const hvac = trackById(HVAC_TRACK);
    const ids = new Set((hvac?.sectors ?? []).map((s) => s.id));
    const out = new Set<string>();
    for (const [id, record] of Object.entries(this.profile.checkpoints)) {
      if (record.passed && ids.has(id)) out.add(id);
    }
    return out;
  }

  private sectorTitles(): Map<string, string> {
    const hvac = trackById(HVAC_TRACK);
    return new Map((hvac?.sectors ?? []).map((s) => [s.id, s.title]));
  }

  private beginCareer = (): void => {
    const passed = this.passedSectors();
    this.career = syncRank(startCareer(this.career, passed), passed);
    saveCareer(this.career);
    this.render();
  };

  /** Send the player to the sector a job is waiting on. */
  private studySector = (sectorId?: string): void => {
    if (sectorId) this.expandedSector = sectorId;
    this.goto({ name: 'home' });
    window.scrollTo({ top: 0 });
  };

  private startJob = (job: Job): void => {
    this.activeJob = job;
    this.call = undefined;
    this.session = undefined;
    this.seed = randomSeed();
    this.shuffleSeed = randomSeed();

    switch (job.template.resolution) {
      case 'diagnose': {
        this.mode = 'service-call';
        this.call = new ServiceCallRun(
          generateServiceCall(createRng(this.seed), job.template.tier),
        );
        this.goto({ name: 'career-job' });
        return;
      }

      case 'knowledge': {
        const hvac = trackById(HVAC_TRACK);
        const built = hvac
          ? buildJobQuiz({
              track: hvac,
              pool: ALL_QUESTIONS,
              domain: job.template.quizDomain ?? '1.0',
              seed: this.seed,
            })
          : undefined;

        // A sector with no content yet must not strand the player on an empty
        // screen — the work still got done, it just was not a test.
        if (!built || built.config.questions.length === 0) {
          this.settle(job, { grade: 'correct', summary: 'Worked through it on site.' });
          return;
        }

        this.mode = 'drill';
        this.session = new Session(built.config);
        resetDraft();
        this.goto({ name: 'career-job' });
        return;
      }

      case 'routine':
        this.settle(job, {
          grade: 'correct',
          summary: 'Straightforward work, done properly.',
        });
        return;
    }
  };

  /** Diagnosing on a career call shows the teaching debrief before settling up. */
  private diagnoseOnJob = (id: FaultId): void => {
    if (!this.call || !this.activeJob) return;
    this.call.diagnose(id);
    this.render();
  };

  private finishJobCall = (): void => {
    const job = this.activeJob;
    const outcome = this.call?.result;
    if (!job || !outcome) return;

    const minutes = siteMinutes(job, outcome.minutesUsed);
    const actual = outcome.actualDef.name.toLowerCase();
    const summary =
      outcome.grade === 'wrong'
        ? `Called it ${outcome.chosenDef.name.toLowerCase()}. It was ${actual}.`
        : outcome.grade === 'lucky'
          ? `${outcome.actualDef.name}, guessed rather than proved.`
          : `Found the ${actual} and fixed it.`;

    this.call = undefined;
    this.settle(job, { grade: outcome.grade, minutesUsed: minutes, summary });
  };

  private walkAway = (): void => {
    const job = this.activeJob;
    if (!job) return this.goto({ name: 'career' });
    this.call = undefined;
    this.session = undefined;
    this.activeJob = undefined;
    this.career = abandonJob(this.career, job);
    saveCareer(this.career);
    this.goto({ name: 'career' });
  };

  /** Apply a finished job to the career and show the receipt. */
  private settle(job: Job, result: JobResult, percent?: number): void {
    const before = this.career;
    const after = settleJob(before, job, result, this.passedSectors());

    this.career = after;
    saveCareer(after);
    this.activeJob = undefined;
    this.session = undefined;
    this.call = undefined;

    this.goto({
      name: 'career-debrief',
      payoff: {
        job,
        grade: result.grade,
        paid: after.money - before.money,
        reputationDelta: after.reputation - before.reputation,
        summary: result.summary,
        ...(after.rank === before.rank ? {} : { promotedTo: rank(after.rank).title }),
        ...(percent === undefined ? {} : { percent }),
        ...this.studyHint(job),
      },
    });
  }

  /**
   * Score a knowledge job.
   *
   * Unanswered questions count as missed, for the same reason a checkpoint does
   * it: walking off a call two questions in is not a 100% call.
   */
  private finishJobQuiz(): void {
    const job = this.activeJob;
    if (!job || !this.session) return;

    const snap = this.session.snapshot();
    const total = Math.max(snap.answered.length, snap.total);
    const percent = total === 0 ? 0 : Math.round((snap.correctCount / total) * 100);
    const grade = gradeFromQuiz(percent);

    const summary =
      grade === 'wrong'
        ? 'Out of your depth on this one. The customer noticed.'
        : grade === 'lucky'
          ? 'Got there in the end, with some help from the manual.'
          : grade === 'clean'
            ? 'Diagnosed, explained and signed off without a wasted move.'
            : 'Sorted it and explained what you found.';

    this.settle(job, { grade, summary }, percent);
  }

  /**
   * The sector a job leans on, for the "go and read this" button on a bad call.
   *
   * A knowledge job names its own domain. A diagnostic call does not, so use the
   * last sector it required — which is the deepest thing it asked you to know.
   */
  private studyHint(job: Job): { studySector?: { id: string; title: string } } {
    const titles = this.sectorTitles();
    const id =
      job.template.quizDomain ?? job.template.requiresSectors[job.template.requiresSectors.length - 1];
    const title = id ? titles.get(id) : undefined;
    return id && title ? { studySector: { id, title } } : {};
  }

  private buy = (id: ToolId): void => {
    const result = buyTool(this.career, id);
    this.career = result.state;
    this.vanNotice = result.reason;
    if (result.bought) saveCareer(this.career);
    this.render();
  };

  private endWorkingDay = (): void => {
    const { state, summary } = endDay(this.career, this.passedSectors());
    this.career = state;
    this.selectedDistrict = undefined;
    saveCareer(this.career);
    this.goto({ name: 'career-day', summary });
  };

  /**
   * Keep the career in step with the study side.
   *
   * Called whenever a checkpoint result lands: passing a sector can promote you
   * on the spot, and the promotion should be waiting on the career screen rather
   * than discovered later.
   */
  private syncCareerWithStudy(): void {
    if (!this.career.started) return;
    const before = this.career;
    const after = syncRank(before, this.passedSectors());
    if (after === before) return;
    this.career = refreshBoard(after, this.passedSectors());
    saveCareer(this.career);
  }

  private startMixed = (): void => {
    this.mode = 'drill';
    this.domain = undefined;
    this.seed = randomSeed();
    this.shuffleSeed = randomSeed();

    const built = buildMixedDrill(this.seed);
    this.session = new Session(built.config);
    resetDraft();
    this.stopTimer();
    this.goto({ name: 'play' });
  };

  private start = (mode: ModeId, domain?: string): void => {
    if (mode === 'service-call') return this.startServiceCall();

    this.mode = mode;
    this.domain = domain;
    this.seed = randomSeed();
    this.shuffleSeed = randomSeed();

    const built = buildSession({
      mode,
      track: this.track,
      pool: ALL_QUESTIONS,
      profile: this.profile,
      seed: this.seed,
      ...(domain ? { domain } : {}),
    });

    if (built.config.questions.length === 0) {
      this.goto({ name: 'home' });
      return;
    }

    this.seed = built.seed;
    this.session = new Session(built.config);
    resetDraft();
    this.startTimerIfNeeded();
    this.goto({ name: 'play' });
  };

  private answer = (response: Response): void => {
    if (!this.session) return;
    const snap = this.session.snapshot();
    const question = snap.question;
    if (!question) return;

    const judgement = this.session.answer(response);

    // Generated questions are not tracked by the scheduler — their ids embed a
    // seed and would never be seen twice, so they would only bloat the profile.
    if (question.source.kind !== 'generated') {
      this.profile = recordReview(this.profile, question.id, judgement.credit, Date.now());
      saveProfile(this.profile);
    }

    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private next = (): void => {
    if (!this.session) return;
    this.session.next();
    resetDraft();
    this.shuffleSeed = randomSeed();

    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private skip = (): void => {
    if (!this.session) return;
    this.session.skip();
    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private finishRun = (): void => {
    if (!this.session) return;
    this.stopTimer();
    this.session.finish();

    // A session run as part of a job settles into the career instead of the
    // results screen — the score is the work, not a separate thing to beat.
    if (this.activeJob) return this.finishJobQuiz();

    const snap = this.session.snapshot();
    const previousBest = this.profile.bests[this.mode] ?? 0;
    const asked = snap.answered.length;
    const graded = this.mode === 'exam' || this.mode === 'checkpoint';

    if (asked > 0) {
      const percent = Math.round((snap.correctCount / asked) * 100);

      this.profile = recordRun(
        this.profile,
        {
          mode: this.mode,
          track: this.track.id,
          at: Date.now(),
          score: snap.score,
          asked,
          correct: snap.correctCount,
          ...(graded ? { percent } : {}),
        },
        snap.bestStreak,
      );

      // A checkpoint is scored against the whole sector, so an abandoned run
      // counts every unanswered question as missed — otherwise quitting after
      // two right answers would read as 100%.
      if (this.mode === 'checkpoint' && this.domain) {
        const sector = this.track.sectors?.find((s) => s.id === this.domain);
        if (sector) {
          const total = Math.max(asked, snap.total);
          const sectorPercent = Math.round((snap.correctCount / total) * 100);
          this.profile = recordCheckpoint(
            this.profile,
            sector.id,
            sectorPercent,
            sector.checkpoint.passPercent,
            Date.now(),
          );
        }
      }

      saveProfile(this.profile);
      this.syncCareerWithStudy();
    }

    this.goto({ name: 'results', previousBest });
  };

  // -------------------------------------------------------------------------
  // Timer
  // -------------------------------------------------------------------------

  private startTimerIfNeeded(): void {
    this.stopTimer();
    if (this.session?.timeLeftSec() === undefined) return;

    this.timer = window.setInterval(() => {
      if (!this.session) return this.stopTimer();
      if ((this.session.timeLeftSec() ?? 1) <= 0) {
        this.finishRun();
        return;
      }
      // Only the HUD changes each tick, but a full re-render at 1 Hz is cheap
      // and keeps the single-source-of-truth rendering model intact.
      if (this.screen.name === 'play') this.render();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  // -------------------------------------------------------------------------
  // Misc
  // -------------------------------------------------------------------------

  private selectTrack = (trackId: string): void => {
    const found = trackById(trackId);
    if (!found) return;
    this.track = found;
    safeSet(TRACK_KEY, trackId);
    this.render();
  };

  private resetProgress = (): void => {
    clearProfile();
    this.profile = emptyProfile();
    this.render();
  };

  /**
   * Keyboard control. Number keys pick an option, Enter advances, S skips.
   * Typing in a text field is left alone.
   */
  private onKeydown = (event: KeyboardEvent): void => {
    if (this.screen.name !== 'play' || !this.session) return;
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

    const snap = this.session.snapshot();

    if (event.key === 'Enter') {
      if (snap.phase === 'revealed') {
        event.preventDefault();
        this.next();
      }
      return;
    }

    if (event.key.toLowerCase() === 's' && snap.phase === 'asking') {
      event.preventDefault();
      this.skip();
      return;
    }

    if (snap.phase !== 'asking' || !snap.question) return;

    const digit = Number(event.key);
    if (!Number.isInteger(digit) || digit < 1) return;

    const buttons = this.root.querySelectorAll<HTMLButtonElement>('.choice, .match-item');
    const button = buttons[digit - 1];
    if (button && !button.disabled) {
      event.preventDefault();
      button.click();
    }
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing. Not worth surfacing.
  }
}

export function mount(root: HTMLElement): App {
  return new App(root);
}

export { h };
